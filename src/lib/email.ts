import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_DOMAIN)
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = `noreply@${process.env.RESEND_FROM_DOMAIN}`

  await resend.emails.send({
    from,
    to,
    subject: "Reset your Matchday password",
    html: `
      <p>You requested a password reset for your Matchday account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  })
}
