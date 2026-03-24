import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = `Matchday <notifications@${process.env.RESEND_FROM_DOMAIN}>`
  const { error } = await resend.emails.send({ from, to: [to], subject, html })
  if (error) throw new Error(`Resend error: ${error.message}`)
}
