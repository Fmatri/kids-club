import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  HeartPulse,
  MessageCircle,
  Pencil,
  Phone,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import { connectDB } from "@/lib/db";
import {
  calculerAge,
  formatDate,
  formatHeure,
  formatTelephone,
  lienWhatsApp,
} from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Inscription } from "@/models/Inscription";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

const NOMS_LIENS = { mere: "Mère", pere: "Père", tuteur: "Tuteur" } as const;

function Bloc({
  titre,
  icone: Icone,
  className,
  delai = 0,
  children,
}: {
  titre: string;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  className?: string;
  delai?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("apparition flex flex-col gap-4 rounded-carte border border-bordure bg-surface p-6 shadow-carte", className)}
      style={{ animationDelay: `${delai}ms` }}
    >
      <h2 className="flex items-center gap-2.5 text-base font-semibold">
        <Icone className="size-[18px]" strokeWidth={1.8} aria-hidden />
        {titre}
      </h2>
      {children}
    </section>
  );
}

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-bordure pt-3 first:border-t-0 first:pt-0">
      <span className="text-[13px] text-encre-douce">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

function Telephone({ numero, whatsapp }: { numero: string; whatsapp?: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{formatTelephone(numero)}</span>
      <a
        href={`tel:${numero}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-bordure bg-surface px-3 text-xs font-semibold transition hover:-translate-y-px"
      >
        <Phone className="size-3.5" strokeWidth={2} aria-hidden />
        Appeler
      </a>
      <a
        href={lienWhatsApp(whatsapp || numero)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-pastel-menthe px-3 text-xs font-semibold transition hover:-translate-y-px"
      >
        <MessageCircle className="size-3.5" strokeWidth={2} aria-hidden />
        WhatsApp
      </a>
    </div>
  );
}

export default async function PageParticipant({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const p = await Participant.findById(id).lean();
  if (!p) notFound();

  const [parents, inscriptions] = await Promise.all([
    Parent.find({ _id: { $in: p.parents.map((l) => l.parent) } }).lean(),
    Inscription.find({ participant: p._id }).sort({ dateDebut: -1 }).lean(),
  ]);
  const seances = await Seance.find({ _id: { $in: inscriptions.map((i) => i.seance) } }).lean();

  const parentParId = new Map(parents.map((x) => [String(x._id), x]));
  const seanceParId = new Map(seances.map((s) => [String(s._id), s]));

  // Parents liés, le principal en premier
  const liens = p.parents
    .flatMap((l) => {
      const parent = parentParId.get(String(l.parent));
      return parent ? [{ lien: l.lien, principal: l.principal, parent }] : [];
    })
    .sort((a, b) => Number(b.principal) - Number(a.principal));

  const decrireSeance = (idSeance: unknown) => {
    const s = seanceParId.get(String(idSeance));
    if (!s) return "Séance inconnue";
    const jour = JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE];
    return `${jour} ${formatHeure(s.heureDebut)} – ${formatHeure(s.heureFin)}${s.active ? "" : " (désactivée)"}`;
  };
  const enCours = inscriptions.filter((i) => i.enCours);
  const terminees = inscriptions.filter((i) => !i.enCours);

  const age = p.dateNaissance ? calculerAge(p.dateNaissance) : null;
  const allergies = p.sante?.allergies ?? [];
  const urgence = p.contactUrgence;

  return (
    <>
            <div className="apparition mt-2 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/participants"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre"
        >
          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
          Participants
        </Link>
        <Link
          href={`/admin/participants/${id}/modifier`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-encre px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px"
        >
          <Pencil className="size-4" strokeWidth={2} aria-hidden />
          Modifier
        </Link>
      </div>

      <EnTetePage
        titre={p.prenom}
        accent={p.nom}
        description={[
          p.type === "enfant" ? "Enfant" : "Adulte",
          age != null ? `${age} ans` : null,
          p.statut === "actif" ? "Actif" : "Inactif",
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Informations */}
        <Bloc titre="Informations" icone={User} delai={60}>
          <div className="flex flex-col gap-3">
            {p.dateNaissance && <Ligne label="Date de naissance">{formatDate(p.dateNaissance)}</Ligne>}
            <Ligne label="Autorisation photo">{p.autorisationPhoto ? "Autorisée" : "Non autorisée"}</Ligne>
            <Ligne label="Statut">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  p.statut === "actif" ? "bg-succes-fond text-succes" : "bg-neutre-fond text-neutre",
                )}
              >
                {p.statut === "actif" ? "Actif" : "Inactif"}
              </span>
            </Ligne>
            {p.notes && <Ligne label="Notes">{p.notes}</Ligne>}
          </div>
        </Bloc>

        {/* Parents (enfant) ou contact (adulte) */}
        {p.type === "enfant" ? (
          <Bloc titre="Parents" icone={Users} delai={120}>
            {liens.length === 0 && <p className="text-sm text-encre-douce">Aucun parent lié.</p>}
            {liens.map(({ lien, principal, parent }) => (
              <div
                key={String(parent._id)}
                className="flex flex-col gap-2 border-t border-bordure pt-4 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {parent.prenom} {parent.nom}
                  </span>
                  <span className="rounded-full bg-neutre-fond px-2.5 py-0.5 text-xs font-semibold text-neutre">
                    {NOMS_LIENS[lien]}
                  </span>
                  {principal && (
                    <span className="rounded-full bg-pastel-lavande px-2.5 py-0.5 text-xs font-semibold">
                      Principal
                    </span>
                  )}
                </div>
                <Telephone numero={parent.telephone} whatsapp={parent.whatsapp} />
                {parent.email && <span className="text-[13px] text-encre-douce">{parent.email}</span>}
              </div>
            ))}
          </Bloc>
        ) : (
          <Bloc titre="Contact" icone={Phone} delai={120}>
            {p.telephone ? <Telephone numero={p.telephone} /> : <p className="text-sm text-encre-douce">Aucun téléphone.</p>}
            {p.email && <span className="text-[13px] text-encre-douce">{p.email}</span>}
          </Bloc>
        )}

        {/* Santé */}
        <Bloc titre="Santé" icone={HeartPulse} delai={180}>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => (
                <span key={a} className="rounded-full bg-attention-fond px-3 py-1 text-xs font-semibold text-attention">
                  Allergie : {a}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-encre-douce">Aucune allergie signalée.</p>
          )}
          {p.sante?.remarques && <p className="text-sm">{p.sante.remarques}</p>}
        </Bloc>

        {/* Contact d'urgence */}
        <Bloc titre="Contact d’urgence" icone={ShieldAlert} delai={240}>
          {urgence?.nom || urgence?.telephone ? (
            <div className="flex flex-col gap-2">
              <span className="font-semibold">
                {urgence.nom}
                {urgence.lien ? <span className="font-normal text-encre-douce"> · {urgence.lien}</span> : null}
              </span>
              {urgence.telephone && <Telephone numero={urgence.telephone} />}
            </div>
          ) : (
            <p className="text-sm text-encre-douce">Aucun contact d’urgence renseigné.</p>
          )}
        </Bloc>

        {/* Séances */}
        <Bloc titre="Séances" icone={CalendarDays} className="lg:col-span-2" delai={300}>
          {enCours.length === 0 && <p className="text-sm text-encre-douce">Aucune séance en cours.</p>}
          {enCours.map((i) => (
            <div
              key={String(i._id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-pastel-lavande/60 px-4 py-3"
            >
              <span className="text-sm font-semibold">{decrireSeance(i.seance)}</span>
              <span className="text-[13px] text-encre-douce">depuis le {formatDate(i.dateDebut)}</span>
            </div>
          ))}
          {terminees.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-encre-pale">Historique</p>
              {terminees.map((i) => (
                <div
                  key={String(i._id)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-douce px-4 py-3 text-encre-douce"
                >
                  <span className="text-sm">{decrireSeance(i.seance)}</span>
                  <span className="text-[13px]">
                    du {formatDate(i.dateDebut)}
                    {i.dateFin ? ` au ${formatDate(i.dateFin)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Bloc>
      </div>
    </>
  );
}