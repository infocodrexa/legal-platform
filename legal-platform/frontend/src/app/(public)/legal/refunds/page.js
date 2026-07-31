import { LegalPage } from "@/components/site/legal-page";

export const metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Refund Policy" updated="July 2026">
      <h2>1. When a refund can be requested</h2>
      <p>
        You can request a refund for a consultation that has been
        cancelled — either by you, the lawyer, or due to a technical issue
        that prevented the consultation from taking place. Refund requests
        are made from your dashboard against the specific payment.
      </p>

      <h2>2. Refund process</h2>
      <p>
        Once submitted, a refund request moves through review by our team,
        approval, and processing. Approved refunds are issued back to your
        original payment method through Razorpay and typically reflect
        within 5–7 business days, depending on your bank.
      </p>

      <h2>3. What isn&rsquo;t eligible</h2>
      <p>
        Consultations that were completed as scheduled are not eligible
        for a refund on the basis of dissatisfaction with the legal advice
        given — for concerns about a specific consultation, please contact
        support so we can look into it. Document review itself is free and
        has no associated payment to refund.
      </p>

      <h2>4. Partial refunds</h2>
      <p>
        In some circumstances — for example, a consultation that started
        but was cut short due to a technical issue — a partial refund may
        be issued at our discretion.
      </p>

      <h2>5. Timeline commitment</h2>
      <p>
        We aim to make a decision on every refund request within 3 business
        days of submission, and to complete processing of approved refunds
        within a further 5–7 business days.
      </p>

      <h2>6. Contact</h2>
      <p>
        For a refund request that&rsquo;s taking longer than expected,
        reach out to support@nyayasetu.example with your payment reference.
      </p>
    </LegalPage>
  );
}
