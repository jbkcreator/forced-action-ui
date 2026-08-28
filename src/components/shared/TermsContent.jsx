/**
 * TermsContent — the actual Terms & Conditions / Privacy Policy copy.
 *
 * Single source of truth shared by TermsConsentGate's modal (signup/checkout
 * flows) and the standalone /terms-and-conditions page, so the two can never
 * drift out of sync.
 */
export default function TermsContent({ termsVersion = '2026.06', privacyVersion = '2026.06' }) {
  return (
    <>
      <section>
        <h3 className="text-white font-semibold mb-2">1. Acceptance of Terms</h3>
        <p>
          By accessing and using the Forced Action platform, you agree to be bound by
          these Terms & Conditions. If you do not agree, do not use the service.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">2. Service Description</h3>
        <p>
          Forced Action provides distressed property intelligence, including lead
          generation, property scoring, and related data services. The platform
          aggregates public records and presents them in a structured format.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">3. User Obligations</h3>
        <p>
          You agree to use the platform in compliance with all applicable laws.
          You will not misuse the data, attempt to reverse-engineer the platform,
          or use it for any unlawful purpose.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">4. Privacy Policy</h3>
        <p>
          We collect and process personal information in accordance with our
          Privacy Policy (v{privacyVersion}). This includes your name, email,
          phone number, IP address, and usage data. We do not sell your personal
          information. We may share data with service providers who help operate
          the platform.
        </p>
        <p className="mt-2">
          Your phone number will be used for account-related communications.
          Marketing SMS messages require separate consent and are never a
          condition of using the service.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">5. Limitation of Liability</h3>
        <p>
          Forced Action provides data from public records and makes no guarantees
          about accuracy or completeness. The platform is provided "as is" without
          warranty of any kind.
        </p>
      </section>

      <section>
        <h3 className="text-white font-semibold mb-2">6. Changes to Terms</h3>
        <p>
          We may update these terms at any time. Continued use after changes
          constitutes acceptance of the new terms.
        </p>
      </section>
    </>
  );
}
