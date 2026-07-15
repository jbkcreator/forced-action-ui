import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { ModalClose } from '../ui/Modal';

export const TCPA_CONSENT_TEXT =
  'I agree to receive recurring automated marketing calls and text messages, including calls that use an automated or ' +
  'AI-generated voice, from Forced Action at the phone number provided. Consent is not a condition of purchase. ' +
  'Msg & data rates may apply. Reply STOP to opt out.';

const SCROLL_THRESHOLD = 20; // pixels from bottom

/**
 * TermsConsentGate — reusable T&C + TCPA consent section for any signup flow.
 *
 * Props:
 *   sourceFlow     — 'waitlist' | 'signup' | 'checkout' | 'county_launch'
 *   showTcpa       — whether to show the separate TCPA checkbox (default true)
 *   phoneProvided  — whether a phone number has been entered (TCPA only shows if true)
 *   termsVersion   — default "2026.06"
 *   privacyVersion — default "2026.06"
 *   tcpaVersion    — default "2026.06"
 *   onAccept(payload) — fired when the parent should consider consent complete
 *
 * Payload shape:
 *   {
 *     terms_accepted: bool,
 *     terms_version: "2026.06",
 *     privacy_version: "2026.06",
 *     accepted_text_hash: "sha256...",
 *     modal_opened_at: ISO string | null,
 *     modal_scrolled_to_end_at: ISO string | null,
 *     tcpa_accepted: bool,
 *     tcpa_consent_text: "..." | null,
 *     tcpa_consent_version: "2026.06" | null,
 *     voice_consent_accepted: bool,
 *     voice_consent_text: "..." | null,
 *     voice_consent_version: "2026.06" | null,
 *     user_agent: "..."
 *   }
 *
 * The TCPA checkbox text covers both marketing calls/texts and automated/
 * AI-generated voice calls (B0-06 PEWC), so tcpa_accepted and
 * voice_consent_accepted are always the same value from one checkbox.
 */
export default function TermsConsentGate({
  sourceFlow = 'waitlist',
  showTcpa = true,
  phoneProvided = false,
  termsVersion = '2026.06',
  privacyVersion = '2026.06',
  tcpaVersion = '2026.07',
  onAccept,
  onDecline,
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tcpaAccepted, setTcpaAccepted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Scroll tracking refs
  const modalContentRef = useRef(null);
  const [modalOpenedAt, setModalOpenedAt] = useState(null);
  const [modalScrolledToEndAt, setModalScrolledToEndAt] = useState(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);

  // Compute SHA-256 hash of the consent text displayed
  const consentTextForHash = useMemo(() => {
    const lines = [
      `Terms & Conditions (v${termsVersion})`,
      `Privacy Policy (v${privacyVersion})`,
    ];
    return lines.join('\n---\n');
  }, [termsVersion, privacyVersion]);

  const computedHash = useMemo(() => {
    // Simple hash for client-side — real SHA-256 is done server-side too
    let hash = 0;
    const str = consentTextForHash;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + '00000000000000000000000000000000';
  }, [consentTextForHash]);

  // Scroll-to-bottom detection
  const handleModalScroll = useCallback(() => {
    const el = modalContentRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD;
    if (atBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
      setModalScrolledToEndAt(new Date().toISOString());
    }
  }, [scrolledToBottom]);

  // Open modal — record timestamp
  const openModal = useCallback(() => {
    if (!hasOpenedModal) {
      setHasOpenedModal(true);
      setModalOpenedAt(new Date().toISOString());
    }
    setModalOpen(true);
  }, [hasOpenedModal]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Emit payload whenever termsAccepted or tcpaAccepted changes
  useEffect(() => {
    if (!onAccept) return;
    onAccept({
      terms_accepted: termsAccepted,
      terms_version: termsVersion,
      privacy_version: privacyVersion,
      accepted_text_hash: computedHash,
      modal_opened_at: modalOpenedAt,
      modal_scrolled_to_end_at: scrolledToBottom ? modalScrolledToEndAt : null,
      tcpa_accepted: tcpaAccepted,
      tcpa_consent_text: tcpaAccepted ? TCPA_CONSENT_TEXT : null,
      tcpa_consent_version: tcpaAccepted ? tcpaVersion : null,
      voice_consent_accepted: tcpaAccepted,
      voice_consent_text: tcpaAccepted ? TCPA_CONSENT_TEXT : null,
      voice_consent_version: tcpaAccepted ? tcpaVersion : null,
      user_agent: navigator.userAgent,
    });
  }, [termsAccepted, tcpaAccepted, onAccept, termsVersion, privacyVersion, computedHash, modalOpenedAt, modalScrolledToEndAt, scrolledToBottom, tcpaVersion]);

  const checkboxCls = 'mt-0.5 w-4 h-4 rounded border border-white/[0.2] bg-white/[0.06] text-yellow-400 focus:ring-1 focus:ring-yellow-400/40 shrink-0';

  return (
    <div className="space-y-3 pt-2">
      {/* T&C Checkbox — required, gated by modal scroll */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms-accept"
          checked={termsAccepted}
          disabled={!scrolledToBottom && hasOpenedModal}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className={checkboxCls}
        />
        <label htmlFor="terms-accept" className="text-xs text-slate-400 leading-snug">
          I agree to the{' '}
          <button
            type="button"
            onClick={openModal}
            className="text-yellow-400 underline hover:text-yellow-300"
          >
            Terms & Conditions and Privacy Policy
          </button>
          . {hasOpenedModal && !scrolledToBottom && (
            <span className="text-amber-400 block mt-0.5">
              Please scroll to the bottom of the terms to enable acceptance.
            </span>
          )}
        </label>
      </div>

      {/* TCPA Checkbox — separate, optional, never required */}
      {showTcpa && (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="tcpa-consent"
            checked={tcpaAccepted}
            onChange={(e) => setTcpaAccepted(e.target.checked)}
            className={checkboxCls}
          />
          <label htmlFor="tcpa-consent" className="text-xs text-slate-400 leading-snug">
            {TCPA_CONSENT_TEXT}
          </label>
        </div>
      )}

      {/* T&C / Privacy Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal}>
        <div
          className="relative"
          style={{
            background: 'rgba(15,23,42,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1.25rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          <ModalClose onClick={closeModal} />

          {/* Fixed header */}
          <div className="shrink-0 pb-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-bold text-white">Terms & Conditions</h2>
            <p className="text-xs text-slate-400 mt-1">
              Version {termsVersion} — Last updated June 2026
            </p>
          </div>

          {/* Scrollable body — scroll tracking here */}
          <div
            ref={modalContentRef}
            onScroll={handleModalScroll}
            className="overflow-y-auto flex-1 py-4 space-y-4 text-sm text-slate-300 leading-relaxed"
            style={{ maxHeight: '55vh' }}
          >
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
          </div>

          {/* Fixed footer */}
          <div className="shrink-0 pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500 mb-3">
              Scroll to the bottom of the terms above to enable acceptance.
              {scrolledToBottom && (
                <span className="text-green-400 block mt-1">
                  ✓ You have scrolled through the full terms.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {scrolledToBottom ? 'Close & Accept' : 'Close'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}