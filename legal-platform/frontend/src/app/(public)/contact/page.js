import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/site/section";
import { ContactForm } from "@/components/site/contact-form";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the NyayaSetu team — support, lawyer applications, or press.",
};

const contactDetails = [
  [Mail, "Email", "support@nyayasetu.example"],
  [Phone, "Phone", "+91 612 000 0000"],
  [MapPin, "Office", "Patna, Bihar, India"],
  [Clock, "Response time", "Within one business day"],
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="We read every message"
        description="Whether it's a question about a document, a lawyer application, or something else entirely — send it over."
      />

      <Section>
        <Container className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            {contactDetails.map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass-wash text-brass">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{label}</p>
                  <p className="mt-1 text-ink">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <ContactForm />
        </Container>
      </Section>
    </>
  );
}
