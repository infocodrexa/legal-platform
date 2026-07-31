import { LegalPage } from "@/components/site/legal-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="July 2026">
      <h2>1. What NyayaSetu is</h2>
      <p>
        NyayaSetu is a technology platform that connects individuals with
        independent, licensed lawyers for document review and video
        consultations. NyayaSetu is not a law firm, does not employ the
        lawyers on the platform, and does not itself provide legal advice.
        Every consultation is conducted independently by the lawyer you
        book.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old to create an account. You&rsquo;re
        responsible for keeping your login credentials secure and for all
        activity under your account. Lawyers registering on the platform
        must hold a valid, current Bar Council enrollment and agree to
        submit it for verification before accepting any booking.
      </p>

      <h2>3. Document uploads</h2>
      <p>
        Documents you upload are stored in private, encrypted storage and
        are only accessible to you and the lawyer reviewing them. You
        confirm that you have the right to upload and share any document
        you submit. NyayaSetu does not review documents for legal validity
        itself — that review is performed by the assigned lawyer.
      </p>

      <h2>4. Payments</h2>
      <p>
        Consultation fees are set independently by each lawyer and shown
        before you book. Payments are processed through Razorpay; NyayaSetu
        never stores your card or UPI credentials. A platform commission is
        deducted from each consultation fee before settlement to the
        lawyer, shown as a separate line item on your invoice.
      </p>

      <h2>5. Cancellations and refunds</h2>
      <p>
        Either party may cancel a scheduled consultation before it takes
        place, subject to the terms in our Refund Policy. Refund requests
        are reviewed on a case-by-case basis.
      </p>

      <h2>6. Not a substitute for representation</h2>
      <p>
        A consultation booked through NyayaSetu is professional legal
        advice from the lawyer you book, but does not itself constitute
        formal legal representation unless separately agreed with that
        lawyer. For litigation or ongoing representation, discuss
        engagement terms directly with your lawyer.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        NyayaSetu facilitates the connection between clients and lawyers
        and is not liable for the advice given during a consultation, the
        outcome of any legal matter, or errors in a lawyer&rsquo;s
        document review. Our liability for platform-related issues
        (payment processing errors, service unavailability) is limited to
        the fees paid for the specific transaction in question.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Material changes will
        be notified via email or an in-app notice before they take effect.
      </p>

      <h2>9. Contact</h2>
      <p>Questions about these terms can be sent to support@nyayasetu.example.</p>
    </LegalPage>
  );
}
