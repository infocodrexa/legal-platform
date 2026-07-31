import { Container, Eyebrow } from "@/components/site/section";
import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, description, className }) {
  return (
    <div className={cn("border-b border-paper-line bg-paper-raised/60 py-16 sm:py-20", className)}>
      <Container>
        <div className="max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-3 text-balance font-display text-4xl font-semibold text-ink sm:text-5xl">
            {title}
          </h1>
          {description && <p className="mt-5 text-lg leading-relaxed text-ink-muted">{description}</p>}
        </div>
      </Container>
    </div>
  );
}
