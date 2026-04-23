import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const APP_NAME = 'Digital Kit Approval'
const FROM = `"${APP_NAME}" <${process.env.GMAIL_USER}>`

// ─── OTP Emails ──────────────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'reset') {
  const subject =
    purpose === 'signup'
      ? `${APP_NAME} — Verify your email`
      : `${APP_NAME} — Reset your password`

  const body =
    purpose === 'signup'
      ? `Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.`
      : `Your password reset code is <strong>${otp}</strong>. It expires in 10 minutes.`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject,
    html: wrapHtml(`
      <p style="font-size:15px;">${body}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `),
  })
}

// ─── Kit Stage Assignment ─────────────────────────────────────────────────────

export async function sendStageAssignedEmail(opts: {
  to: string[]
  kitStyleNo: string
  stageName: string
  stageCheck: string
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.to.join(', '),
    subject: `Action required — Kit ${opts.kitStyleNo} awaits your approval`,
    html: wrapHtml(`
      <p>Kit <strong>${opts.kitStyleNo}</strong> has arrived at your department for approval.</p>
      <p><strong>Your check:</strong> ${opts.stageCheck}</p>
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Review Kit
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">Please approve within 4 days to stay on schedule.</p>
    `),
  })
}

// ─── Rejection Notification ───────────────────────────────────────────────────

export async function sendRejectionEmail(opts: {
  to: string[]
  kitStyleNo: string
  rejectedAtStage: string
  rejectedBy: string
  notes: string
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.to.join(', '),
    subject: `Kit ${opts.kitStyleNo} rejected at ${opts.rejectedAtStage} — revision required`,
    html: wrapHtml(`
      <p style="color:#dc2626;font-weight:700;font-size:15px;">Kit Rejected — Revision Required</p>
      <p>Kit <strong>${opts.kitStyleNo}</strong> was <strong>rejected</strong> at the 
         <strong>${opts.rejectedAtStage}</strong> stage by <strong>${opts.rejectedBy}</strong>.</p>
      ${opts.notes ? `<blockquote style="border-left:3px solid #dc2626;margin:12px 0;padding:8px 12px;background:#fef2f2;color:#7f1d1d;font-style:italic;">${opts.notes}</blockquote>` : ''}
      <p>The kit has been moved back to <strong>Draft</strong>. Please review the feedback, make the necessary changes, and re-submit for approval.</p>
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Review &amp; Re-submit
        </a>
      </p>
    `),
  })
}

// ─── Reminder Emails ─────────────────────────────────────────────────────────

export async function sendPendingReminderEmail(opts: {
  to: string[]
  kitStyleNo: string
  stageName: string
  daysSinceAssigned: number
  daysRemaining: number
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.to.join(', '),
    subject: `Reminder — Kit ${opts.kitStyleNo} pending your approval (Day ${opts.daysSinceAssigned})`,
    html: wrapHtml(`
      <p>This is a gentle reminder that kit <strong>${opts.kitStyleNo}</strong> is still awaiting 
         your approval at the <strong>${opts.stageName}</strong> stage.</p>
      <p>Day <strong>${opts.daysSinceAssigned}</strong> of ${4} — <strong>${opts.daysRemaining} day${opts.daysRemaining !== 1 ? 's' : ''} remaining</strong> before it becomes delayed.</p>
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Approve Now
        </a>
      </p>
    `),
  })
}

export async function sendDelayedReminderEmail(opts: {
  to: string[]
  kitStyleNo: string
  stageName: string
  delayDays: number
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.to.join(', '),
    subject: `DELAYED — Kit ${opts.kitStyleNo} is overdue by ${opts.delayDays} day${opts.delayDays !== 1 ? 's' : ''}`,
    html: wrapHtml(`
      <p style="color:#dc2626;font-weight:600;">
        Kit <strong>${opts.kitStyleNo}</strong> is delayed by <strong>${opts.delayDays} day${opts.delayDays !== 1 ? 's' : ''}</strong> 
        at the <strong>${opts.stageName}</strong> stage.
      </p>
      <p>This is holding up the production line. Please approve immediately.</p>
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Approve Immediately
        </a>
      </p>
    `),
  })
}

export async function sendEscalationWarningEmail(opts: {
  to: string[]
  kitStyleNo: string
  stageName: string
  delayDays: number
  pendingCount: number
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.to.join(', '),
    subject: `⚠ Warning — Kit ${opts.kitStyleNo} escalates to management in 2 days`,
    html: wrapHtml(`
      <p style="color:#d97706;font-weight:700;font-size:16px;">
        This is a final warning before escalation.
      </p>
      <p>Kit <strong>${opts.kitStyleNo}</strong> at the <strong>${opts.stageName}</strong> stage 
         has been delayed for <strong>${opts.delayDays} days</strong>.</p>
      <p>It will be <strong>escalated to management in 2 days</strong> if not approved.</p>
      ${opts.pendingCount > 1 ? `<p>You have <strong>${opts.pendingCount} kits</strong> currently delayed.</p>` : ''}
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#d97706;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Approve Before Escalation
        </a>
      </p>
    `),
  })
}

export async function sendEscalationEmail(opts: {
  managerEmail: string
  kitStyleNo: string
  stageName: string
  departmentEmail: string[]
  delayDays: number
  kitId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  await transporter.sendMail({
    from: FROM,
    to: opts.managerEmail,
    cc: opts.departmentEmail.join(', '),
    subject: `ESCALATED — Kit ${opts.kitStyleNo} delayed ${opts.delayDays} days at ${opts.stageName}`,
    html: wrapHtml(`
      <p style="color:#dc2626;font-weight:700;font-size:16px;">Escalation Notice</p>
      <p>Kit <strong>${opts.kitStyleNo}</strong> has been delayed for <strong>${opts.delayDays} days</strong> 
         at the <strong>${opts.stageName}</strong> stage without approval.</p>
      <p>Immediate management intervention is required to avoid production delays.</p>
      <p>
        <a href="${appUrl}/kits/${opts.kitId}" 
           style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          View Kit
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;">
        CC'd department members have also been notified.
      </p>
    `),
  })
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
    <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;margin:0 0 24px;">
      Digital Kit Approval
    </p>
    ${body}
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
    <p style="font-size:11px;color:#9ca3af;margin:0;">
      Respectful follow-through without approval fatigue.
    </p>
  </div>
</body>
</html>`
}
