export default function EnTetePage({
  titre,
  accent,
  description,
}: {
  titre: string;
  accent: string;
  description: string;
}) {
  return (
    <section className="apparition flex flex-col gap-1.5 pt-3 pb-7">
      <h1 className="text-4xl leading-none font-semibold tracking-[-0.03em] md:text-5xl">
        {titre}{" "}
        <span className="font-serif text-[1.12em] font-normal italic">{accent}</span>
      </h1>
      <p className="mt-1.5 text-[15px] text-encre-douce">{description}</p>
    </section>
  );
}
