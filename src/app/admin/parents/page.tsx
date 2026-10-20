import Link from "next/link";
import { MessageCircle, Phone, Search } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import { connectDB } from "@/lib/db";
import { formatTelephone, lienWhatsApp, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";

const LIMITE = 200;
const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function PageParents({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerAdmin();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 60);

  await connectDB();

  // Chaque mot doit se trouver dans le prénom, le nom ou le téléphone
  const conditions = q
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((mot) => {
      const rx = new RegExp(echapper(mot), "i");
      return { $or: [{ nom: rx }, { prenom: rx }, { telephone: rx }] };
    });

  const parents = await Parent.find(conditions.length ? { $and: conditions } : {})
    .sort({ nom: 1, prenom: 1 })
    .limit(LIMITE)
    .lean();

  // Enfants de ces parents
  const enfants = await Participant.find({ "parents.parent": { $in: parents.map((p) => p._id) } })
    .select("prenom statut parents")
    .lean();
  const enfantsDe = new Map<string, { prenom: string; inactif: boolean }[]>();
  for (const enfant of enfants) {
    for (const lien of enfant.parents) {
      const cle = String(lien.parent);
      enfantsDe.set(cle, [...(enfantsDe.get(cle) ?? []), { prenom: enfant.prenom, inactif: enfant.statut === "inactif" }]);
    }
  }

  return (
    <>
      <EnTetePage
        titre="Les"
        accent="parents"
        description={`${pluriel(parents.length, "parent")}${q ? ` pour « ${q} »` : ""}`}
      />

      <form
        action="/admin/parents"
        role="search"
        className="apparition mb-6 flex h-12 max-w-xl items-center gap-2.5 rounded-full border border-bordure bg-surface px-4 text-encre-pale transition-colors [animation-delay:80ms] focus-within:border-encre"
      >
        <Search className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
        <label htmlFor="q-parents" className="sr-only">
          Rechercher un parent
        </label>
        <input
          key={q}
          id="q-parents"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Prénom, nom ou téléphone…"
          className="w-full min-w-0 bg-transparent text-sm text-encre outline-none placeholder:text-encre-pale"
        />
      </form>

      {parents.length === 0 ? (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Aucun parent ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="apparition flex flex-col overflow-hidden rounded-carte border border-bordure bg-surface shadow-carte [animation-delay:140ms]">
          {parents.map((p) => {
            const sesEnfants = enfantsDe.get(String(p._id)) ?? [];
            return (
              <li
                key={String(p._id)}
                className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-bordure px-5 py-4 transition first:border-t-0 hover:bg-surface-douce"
              >
                {/* Lien invisible sur toute la ligne → page du parent */}
                <Link href={`/admin/parents/${String(p._id)}`} className="absolute inset-0">
                  <span className="sr-only">
                    Ouvrir {p.prenom} {p.nom}
                  </span>
                </Link>

                <span className="pointer-events-none relative flex size-10 shrink-0 items-center justify-center rounded-full bg-pastel-rose text-sm font-bold">
                  {`${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase()}
                </span>
                <div className="pointer-events-none relative min-w-0 flex-1 basis-40">
                  <p className="truncate font-semibold">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-[13px] text-encre-douce">{formatTelephone(p.telephone)}</p>
                </div>
                <div className="pointer-events-none relative flex basis-48 flex-wrap gap-1.5">
                  {sesEnfants.length > 0 ? (
                    sesEnfants.map((enfant, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-pastel-lavande/70 px-2.5 py-1 text-xs font-semibold"
                        style={{ opacity: enfant.inactif ? 0.5 : 1 }}
                      >
                        {enfant.prenom}
                      </span>
                    ))
                  ) : (
                    <span className="text-[13px] text-encre-pale">Aucun enfant</span>
                  )}
                </div>
                {/* Boutons au-dessus du lien invisible */}
                <div className="relative z-10 flex gap-2">
                  <a
                    href={`tel:${p.telephone}`}
                    aria-label={`Appeler ${p.prenom} ${p.nom}`}
                    className="flex size-9 items-center justify-center rounded-full border border-bordure bg-surface transition hover:-translate-y-px"
                  >
                    <Phone className="size-4" strokeWidth={2} aria-hidden />
                  </a>
                  <a
                    href={lienWhatsApp(p.whatsapp || p.telephone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${p.prenom} ${p.nom}`}
                    className="flex size-9 items-center justify-center rounded-full bg-pastel-menthe transition hover:-translate-y-px"
                  >
                    <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {parents.length === LIMITE && (
        <p className="mt-3 text-[13px] text-encre-pale">
          Seuls les {LIMITE} premiers résultats sont affichés : affinez la recherche.
        </p>
      )}
    </>
  );
}