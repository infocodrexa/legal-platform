import { LegalPage } from "@/components/site/legal-page";

export const metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <LegalPage eyebrow="Legal" title="Disclaimer" updated="July 2026">
      <h2>Not a law firm</h2>
      <p>
        NyayaSetu is a technology platform, not a law firm. We do not
        provide legal advice, and nothing on this website constitutes legal
        advice. Legal advice is provided solely by the independent, licensed
        lawyers you consult through the platform, in their individual
        professional capacity.
      </p>

      <h2>No attorney-client relationship with NyayaSetu</h2>
      <p>
        Using this platform, including uploading a document for review,
        does not create an attorney-client relationship with NyayaSetu.
        Any attorney-client relationship exists solely between you and the
        specific lawyer you engage.
      </p>

      <h2>Document verification is a professional review, not a guarantee</h2>
      <p>
        A document marked &ldquo;Verified&rdquo; has been reviewed by a
        licensed lawyer and found to meet the standards they applied during
        that review. This is a professional opinion, not a guarantee of
        legal validity, enforceability, or outcome in any future dispute or
        proceeding.
      </p>

      <h2>Educational content</h2>
      <p>
        Articles published on our blog are general information intended to
        help readers understand common legal topics. They are not a
        substitute for advice tailored to your specific situation, and
        laws referenced may have changed since publication.
      </p>

      <h2>Jurisdiction</h2>
      <p>
        Lawyers on the platform are licensed to practice in India. Content
        and consultations are intended for matters governed by Indian law.
      </p>
    </LegalPage>
  );
}
