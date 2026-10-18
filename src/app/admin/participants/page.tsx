import Link from "next/link";
import { Search } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import { connectDB } from "@/lib/db";
import { calculerAge, formatHeure, formatTelephone, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Inscription } from "@/models/Inscription";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

type Recherche = { q?: string; type?: string; statut?: string };
type Filtre = Parameters<typeof Participant.find>[0];

const LIMITE = 200;

// Neutralise les caractères spéciaux d'une recherche (sécurité)
const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Construit l'adresse d'un filtre en gardant les autres
function lienFiltre(actuel: Recherche, change: Recherche) {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries({ ...actuel, ...change })) {
    if (valeur) params.set(cle, valeur);
  }
  const texte = params.toString();
  return texte ? `/admin/participants?${texte}` : "/admin/participants";
}

function Pastille({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold transition",
        actif ? "bg-encre text-white" : "border border-bordure bg-surface text-encre-douce hover:text-encre",
      )}
    >
      {children}
    </Link>
  );
}

export default async function PageParticipants({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerAdmin();
  const sp = await searchParams;

  // Lecture prudente des filtres de l'adresse
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 60);
  const type = sp.type === "enfant" || sp.type === "adulte" ? sp.type : undefined;
  const statut = sp.statut === "inactif" || sp.statut === "tous" ? sp.statut : "actif";
  const actuel: Recherche = {
    q: q || undefined,
    type,
    statut: statut === "actif" ? undefined : statut,
  };

  await connectDB();

  // Conditions de recherche
  const conditions: Record<string, unknown>[] = [];
  if (type) conditions.push({ type });
  if (statut !== "tous") conditions.push({ statut });
  for (const mot of q.split(/\s+/).filter(Boolean).slice(0, 4)) {
    const rx = new RegExp(echapper(mot), "i");
    const parentsTrouves = await Parent.find({
      $or: [{ nom: rx }, { prenom: rx }, { telephone: rx }],
    })
      .select("_id")
      .lean();
    conditions.push({
      $or: [
        { nom: rx },
        { prenom: rx },
        { telephone: rx },
        { "parents.parent": { $in: parentsTrouves.map((p) => p._id) } },
      ],
    });
  }

  const participants = await Participant.find((conditions.length ? { $and: conditions } : {}) as Filtre)
    .sort({ nom: 1, prenom: 1 })
    .limit(LIMITE)
    .lean();

  // Parents principaux + séances en cours de ces participants
  const idsParents = participants.flatMap((p) => p.parents.map((l) => l.parent));
  const [parents, inscriptions] = await Promise.all([
    Parent.find({ _id: { $in: idsParents } }).select("nom prenom telephone").lean(),
    Inscription.find({ participant: { $in: participants.map((p) => p._id) }, enCours: true })
      .select("participant seance")
      .lean(),
  ]);
  const seances = await Seance.find({ _id: { $in: inscriptions.map((i) => i.seance) } })
    .select("jour heureDebut")
    .lean();

  const parId = new Map(parents.map((p) => [String(p._id), p]));
  const nomSeance = new Map(
    seances.map((s) => [
      String(s._id),
      `${JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE].slice(0, 3)}. ${formatHeure(s.heureDebut)}`,
    ]),
  );
  const seancesDe = new Map<string, string[]>();
  for (const i of inscriptions) {
    const cle = String(i.participant);
    seancesDe.set(cle, [...(seancesDe.get(cle) ?? []), nomSeance.get(String(i.seance)) ?? "?"]);
  }

  const lignes = participants.map((p) => {
    const lienPrincipal = p.parents.find((l) => l.principal) ?? p.parents[0];
    const parent = lienPrincipal ? parId.get(String(lienPrincipal.parent)) : undefined;
    return {
      id: String(p._id),
      nom: `${p.prenom} ${p.nom}`,
      initiales: `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase(),
      type: p.type,
      age: p.dateNaissance ? calculerAge(p.dateNaissance) : null,
      inactif: p.statut === "inactif",
      seances: seancesDe.get(String(p._id)) ?? [],
      contact:
        p.type === "adulte"
          ? p.telephone
            ? formatTelephone(p.telephone)
            : "—"
          : parent
            ? `${parent.prenom} ${parent.nom} · ${formatTelephone(parent.telephone)}`
            : "—",
    };
  });

  return (
    <>
      <EnTetePage
        titre="Nos"
        accent="participants"
        description={`${pluriel(lignes.length, "participant")}${q ? ` pour « ${q} »` : ""}`}
      />

      {/* Recherche + filtres */}
      <div className="apparition mb-6 flex flex-col gap-3 [animation-delay:80ms]">
        <form
          action="/admin/participants"
          role="search"
          className="flex h-12 max-w-xl items-center gap-2.5 rounded-full border border-bordure bg-surface px-4 text-encre-pale transition-colors focus-within:border-encre"
        >
          <Search className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
          <label htmlFor="q-participants" className="sr-only">
            Rechercher un participant
          </label>
          <input
            key={q}
            id="q-participants"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Prénom, nom, parent ou téléphone…"
            className="w-full min-w-0 bg-transparent text-sm text-encre outline-none placeholder:text-encre-pale"
          />
          {type && <input type="hidden" name="type" value={type} />}
          {statut !== "actif" && <input type="hidden" name="statut" value={statut} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Pastille href={lienFiltre(actuel, { type: undefined })} actif={!type}>Tous</Pastille>
          <Pastille href={lienFiltre(actuel, { type: "enfant" })} actif={type === "enfant"}>Enfants</Pastille>
          <Pastille href={lienFiltre(actuel, { type: "adulte" })} actif={type === "adulte"}>Adultes</Pastille>
          <span className="mx-1 h-5 w-px bg-bordure" aria-hidden />
          <Pastille href={lienFiltre(actuel, { statut: undefined })} actif={statut === "actif"}>Actifs</Pastille>
          <Pastille href={lienFiltre(actuel, { statut: "inactif" })} actif={statut === "inactif"}>Inactifs</Pastille>
          <Pastille href={lienFiltre(actuel, { statut: "tous" })} actif={statut === "tous"}>Tous statuts</Pastille>
        </div>
      </div>

      {/* Liste */}
      {lignes.length === 0 ? (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Aucun participant ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="apparition flex flex-col overflow-hidden rounded-carte border border-bordure bg-surface shadow-carte [animation-delay:140ms]">
          {lignes.map((l) => (
            <li key={l.id} className="border-t border-bordure first:border-t-0">
              <Link
                href={`/admin/participants/${l.id}`}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-surface-douce",
                  l.inactif && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    l.type === "enfant" ? "bg-pastel-lavande" : "bg-pastel-peche",
                  )}
                >
                  {l.initiales}
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-semibold">{l.nom}</p>
                  <p className="text-[13px] text-encre-douce">
                    {l.type === "enfant" ? `Enfant${l.age != null ? ` · ${l.age} ans` : ""}` : "Adulte"}
                    {l.inactif ? " · inactif" : ""}
                  </p>
                </div>
                <div className="flex basis-48 flex-wrap gap-1.5">
                  {l.seances.length > 0 ? (
                    l.seances.map((s) => (
                      <span key={s} className="rounded-full bg-neutre-fond px-2.5 py-1 text-xs font-semibold text-neutre">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[13px] text-encre-pale">Aucune séance</span>
                  )}
                </div>
                <p className="basis-56 text-[13px] text-encre-douce sm:text-right">{l.contact}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {lignes.length === LIMITE && (
        <p className="mt-3 text-[13px] text-encre-pale">
          Seuls les {LIMITE} premiers résultats sont affichés : affinez la recherche.
        </p>
      )}
    </>
  );
}