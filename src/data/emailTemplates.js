export default [
  {
    id: "welcome",
    label: "Welcome Email",
    subject: "You're in, {name} — your {vertical} Event Feed is ready",
    to: "mike@example.com",
    tags: [
      { type: "html", text: "HTML" },
      { type: "trigger", text: "checkout.session.completed" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;">
              You&rsquo;re in, Mike.
            </h1>
            <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;">
              Your Event Feed is live and your territory is reserved.
            </p>
            <p style="margin:0 0 12px;">
              <span style="display:inline-block;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);
                           color:#4ade80;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.05em;text-transform:uppercase;">
                &#10003; Early Access Member
              </span>
            </p>
            <p style="margin:0 0 24px;">
              <span style="display:inline-block;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);
                           color:#fbbf24;font-size:13px;font-weight:700;padding:5px 14px;border-radius:999px;">
                Starter &middot; Roofing
              </span>
            </p>
            <p style="margin:0 0 12px;font-size:14px;color:#94a3b8;">
              Your private feed link — bookmark it:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Open My Event Feed &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#ffffff;">What happens next</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Scrapers run daily — new distressed property leads appear automatically.</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Leads are scored across your selected vertical and ranked by urgency.</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Your territory ZIPs are exclusively yours — no other subscriber sees the same leads.</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? Reply to this email or reach us at <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "welcome-founding",
    label: "Welcome (Founding)",
    subject: "Founding member confirmed, {name} — your {vertical} rate is locked forever",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "html", text: "HTML" },
      { type: "trigger", text: "checkout.session.completed" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;">
              You&rsquo;re in, Sarah.
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              Your Event Feed is live and your territory is reserved.
            </p>
            <p style="margin:0 0 16px;padding:10px 16px;background:#451a03;border:1px solid #92400e;border-radius:8px;color:#fbbf24;font-size:14px;">
              &#11088; Founding Member — your rate is locked for life.
            </p>
            <p style="margin:0 0 24px;">
              <span style="display:inline-block;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);
                           color:#fbbf24;font-size:13px;font-weight:700;padding:5px 14px;border-radius:999px;">
                Pro &middot; Roofing
              </span>
            </p>
            <p style="margin:0 0 12px;font-size:14px;color:#94a3b8;">
              Your private feed link — bookmark it:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Open My Event Feed &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#ffffff;">What happens next</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Scrapers run daily — new distressed property leads appear automatically.</p>
                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Leads are scored across your selected vertical and ranked by urgency.</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;">&#10003; &nbsp;Your territory ZIPs are exclusively yours — no other subscriber sees the same leads.</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? Reply to this email or reach us at <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "payment-receipt",
    label: "Payment Receipt",
    subject: "Payment confirmed — Forced Action {tier} ({zip})",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "text", text: "Text-Only (needs HTML)" },
      { type: "trigger", text: "invoice.payment_succeeded" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;padding:10px 16px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;color:#4ade80;font-size:14px;font-weight:600;">
              &#10003; &nbsp;Payment confirmed
            </p>
            <h1 style="margin:16px 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              Thanks, Sarah.
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              Your payment has been processed successfully.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#ffffff;">Payment Details</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr><td style="color:#94a3b8;padding:4px 0;">Plan</td><td style="color:#ffffff;text-align:right;padding:4px 0;">Pro / Roofing</td></tr>
                  <tr><td style="color:#94a3b8;padding:4px 0;">Territory</td><td style="color:#fbbf24;text-align:right;padding:4px 0;font-weight:600;">ZIP 33548, 33602</td></tr>
                  <tr><td style="color:#94a3b8;padding:4px 0;">Amount</td><td style="color:#ffffff;text-align:right;padding:4px 0;">$499.00</td></tr>
                  <tr><td style="color:#94a3b8;padding:4px 0;">Next billing date</td><td style="color:#ffffff;text-align:right;padding:4px 0;">April 23, 2026</td></tr>
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Access Your Lead Feed &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "payment-failed",
    label: "Payment Failed",
    subject: "Action required — payment failed for your Forced Action subscription",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "html", text: "HTML" },
      { type: "trigger", text: "invoice.payment_failed" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:18px 40px;background:#450a0a;border-bottom:2px solid #7f1d1d;text-align:center;">
                <p style="margin:0;color:#fca5a5;font-size:16px;font-weight:700;letter-spacing:0.02em;">
                  &#9888;&#65039; &nbsp;ACTION REQUIRED &mdash; PAYMENT FAILED
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;">
              We couldn&rsquo;t process your payment
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:16px;">
              Hi Sarah, your <strong style="color:#ffffff;">Pro</strong> subscription payment failed.
              Please update your payment method to keep your territories locked.
            </p>
            <p style="margin:0 0 24px;padding:10px 16px;background:#451a03;border:1px solid #92400e;border-radius:8px;color:#fbbf24;font-size:14px;">
              &#11088; Your founding rate lock is at risk — it cannot be reclaimed if your subscription lapses.
            </p>
            <p style="margin:0 0 12px;font-size:14px;color:#94a3b8;">
              You have <strong style="color:#ffffff;">48 hours</strong> before your ZIP territories enter grace period.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#ef4444;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                    Update Payment Method &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "cancel-scheduled",
    label: "Cancellation Scheduled",
    subject: "Your subscription ends in {days} days — reactivate to keep your territory",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "html", text: "HTML" },
      { type: "trigger", text: "subscription.updated (cancel_at)" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;padding:12px 16px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);border-radius:8px;color:#fb923c;font-size:14px;font-weight:600;">
              &#9200; &nbsp;Cancellation scheduled &mdash; <strong>{days} days remaining</strong>
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              Cancellation scheduled, Sarah.
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              Your Pro subscription will end on <strong style="color:#ffffff;">April 23, 2026</strong>
              (<strong style="color:#fb923c;">{days} days from now</strong>). You keep full access until then.
            </p>
            <p style="margin:0 0 16px;padding:10px 16px;background:#451a03;border:1px solid #92400e;border-radius:8px;color:#fbbf24;font-size:14px;">
              &#11088; Founding Member — your locked rate will be permanently lost if you don&rsquo;t reactivate.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">
              Changed your mind? Reactivate before April 23, 2026 to keep your territory and leads:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Reactivate My Subscription &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "cancel-executed",
    label: "Subscription Cancelled (Grace Period)",
    subject: "Subscription cancelled — reactivate within 48 hours to keep your rate",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "html", text: "HTML" },
      { type: "trigger", text: "subscription.deleted" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;padding:12px 16px;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:15px;font-weight:700;text-align:center;letter-spacing:0.01em;">
              &#128683; &nbsp;YOUR SUBSCRIPTION IS CANCELLED
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              Subscription cancelled, Sarah.
            </h1>
            <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;">
              Your 48-hour grace period runs until
              <strong style="color:#f87171;">March 25, 2026 at 04:35 PM UTC</strong> — you keep full access until then.
            </p>
            <p style="margin:0 0 16px;padding:12px 16px;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:14px;font-weight:600;">
              &#11088; Founding Member — <strong>your locked rate is gone forever</strong> once the grace period expires. This cannot be recovered.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">
              Reactivate now before your grace period expires and lock your territory back in:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#ef4444;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                    Reactivate Now — Before It&rsquo;s Too Late &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "lead-pack",
    label: "Lead Pack Delivery",
    subject: "Your Forced Action Lead Pack — 5 Exclusive Leads",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "text", text: "Text-Only (needs HTML)" },
      { type: "trigger", text: "payment_intent.succeeded" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              Your Lead Pack is ready.
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              5 exclusive leads for ZIP <strong style="color:#fff;">33612</strong> (Roofing) — yours alone for 72 hours.
            </p>

            <!-- Lead 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #c084fc;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">1. 4215 N Armenia Ave, Tampa, FL 33612</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Score: 95.0 &nbsp;|&nbsp; Ultra Platinum &nbsp;|&nbsp; insurance_claims, storm_damage</p>
              </td></tr>
            </table>
            <!-- Lead 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #c084fc;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">2. 8803 N Semmes St, Tampa, FL 33612</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Score: 88.0 &nbsp;|&nbsp; Platinum &nbsp;|&nbsp; fire_incidents, building_permits</p>
              </td></tr>
            </table>
            <!-- Lead 3 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #fbbf24;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">3. 1122 E 127th Ave, Tampa, FL 33612</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Score: 78.0 &nbsp;|&nbsp; Gold &nbsp;|&nbsp; code_violations, insurance_claims</p>
              </td></tr>
            </table>
            <!-- Lead 4 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #fbbf24;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">4. 9901 N 15th St, Tampa, FL 33612</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Score: 73.0 &nbsp;|&nbsp; Gold &nbsp;|&nbsp; storm_damage</p>
              </td></tr>
            </table>
            <!-- Lead 5 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #fbbf24;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">5. 5501 E Busch Blvd, Tampa, FL 33612</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Score: 65.0 &nbsp;|&nbsp; Gold &nbsp;|&nbsp; code_violations</p>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;padding:10px 16px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:8px;color:#fbbf24;font-size:13px;">
              &#128274; Exclusive until March 26, 2026 at 04:35 PM UTC — no other subscriber sees these leads.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:24px 0 28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    View Full Lead Details &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "zip-available",
    label: "ZIP Territory Available (Waitlist)",
    subject: "ZIP {zip} just opened up — {vertical} territory available | Forced Action",
    to: "waitlist-user@example.com",
    tags: [
      { type: "text", text: "Text-Only (needs HTML)" },
      { type: "trigger", text: "grace_expiry task" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;padding:12px 16px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;color:#4ade80;font-size:14px;font-weight:600;">
              &#127881; &nbsp;A territory you wanted just opened up!
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              ZIP 33612 is available
            </h1>
            <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;">
              Great news — the <strong style="color:#ffffff;">Roofing</strong> territory for ZIP <strong style="color:#ffffff;">33612</strong>
              in Hillsborough County just opened up and you&rsquo;re on the waitlist.
            </p>
            <p style="margin:0 0 16px;padding:10px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:14px;color:#cbd5e1;">
              &#128202; &nbsp;This ZIP generated <strong style="color:#ffffff;">47 scored leads</strong> last month — one of the most active territories in Hillsborough County.
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">
              Lock it now before someone else does — territories are first come, first served.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Lock ZIP 33612 Now &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    id: "price-escalation",
    label: "Price Escalation Notice",
    subject: "Pricing update for your {tier} plan, {name}",
    to: "sarah@roofingpro.com",
    tags: [
      { type: "text", text: "Text-Only (needs HTML)" },
      { type: "trigger", text: "price_escalation task (6mo)" },
    ],
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:linear-gradient(135deg,#facc15,#f59e0b);border-radius:8px;text-align:center;vertical-align:middle;font-size:13px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">FA</td>
              <td style="padding-left:10px;font-size:22px;font-weight:800;color:#ffffff;vertical-align:middle;">Forced <span style="color:#fbbf24;">Action</span></td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;padding:12px 16px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:8px;color:#fbbf24;font-size:14px;font-weight:600;">
              &#128197; &nbsp;Pricing update effective next billing cycle
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">
              Update to your subscription
            </h1>
            <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">
              Hi Sarah, your 6-month founding rate period for your <strong style="color:#fff;">Pro</strong> plan has ended.
              Starting at your next billing date, the current regular rate will apply.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#ffffff;">What&rsquo;s changing</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
                  <tr>
                    <td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">Previous rate (founding)</td>
                    <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                      <span style="color:#ef4444;text-decoration:line-through;font-size:16px;font-weight:600;">$499/mo</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">New rate (regular)</td>
                    <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                      <span style="color:#fbbf24;font-size:20px;font-weight:800;">$1,500/mo</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;padding:8px 0;">Effective date</td>
                    <td style="color:#ffffff;text-align:right;padding:8px 0;font-weight:600;">April 23, 2026</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;">
              Your ZIP territories and lead access are unchanged — everything works exactly the same.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fbbf24;border-radius:8px;">
                  <a href="#" style="display:inline-block;padding:14px 28px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">
                    Access Your Lead Feed &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#64748b;">
              Questions? <a href="#" style="color:#fbbf24;text-decoration:none;">info@forcedactionleads.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#475569;text-align:center;">
            Forced Action &mdash; Hillsborough County Property Intelligence
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
];
