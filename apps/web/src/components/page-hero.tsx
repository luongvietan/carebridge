import { marketingHeading, marketingSubheading } from "@/lib/marketing-ui";

type PageHeroProps = {
  title: string;
  description?: string;
};

export function PageHero({ title, description }: PageHeroProps) {
  return (
    <section className="px-5 pt-8 pb-6 sm:px-6 sm:pt-12 sm:pb-8 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className={marketingHeading}>{title}</h1>
        {description ? <p className={`mt-4 max-w-2xl ${marketingSubheading}`}>{description}</p> : null}
      </div>
    </section>
  );
}
