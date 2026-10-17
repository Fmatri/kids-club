import BarreHaut from "@/components/BarreHaut";
import BarreMobile from "@/components/BarreMobile";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";
import MenuAdmin from "@/components/MenuAdmin";
import { exigerAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await exigerAdmin();
  const nom = session.user.name;

  return (
    <div className="min-h-dvh fond-degrade">
      <div className="mx-auto flex max-w-[1600px]">
        {/* Menu gauche (ordinateur et tablette) */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-7 overflow-y-auto px-5 py-7 md:flex">
          <div className="flex items-center gap-3 px-1.5">
            <span className="flex size-[42px] items-center justify-center rounded-[14px] bg-linear-135 from-pastel-rose to-pastel-lavande font-serif text-[26px] italic">
              P
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">Pygmalion</span>
              <span className="text-xs text-encre-pale">Art Club · Gestion</span>
            </div>
          </div>

          <MenuAdmin />

          <div className="mt-auto flex flex-col gap-3 rounded-carte border border-bordure bg-linear-160 from-surface to-[#fbf3ec] p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-pastel-peche text-sm font-bold">
                {nom.charAt(0).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{nom}</span>
                <span className="text-xs text-encre-pale">Gérante</span>
              </div>
            </div>
            <BoutonDeconnexion className="w-full" />
          </div>
        </aside>

        {/* Contenu */}
        <div className="min-w-0 flex-1 px-4 pb-28 md:px-8 md:pb-12">
          <BarreHaut />
          <main>{children}</main>
        </div>
      </div>

      {/* Barre du bas (téléphone) */}
      <BarreMobile />
    </div>
  );
}