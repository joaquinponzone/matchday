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
    subject: "Restablece tu contraseña",
    html: `
      <p>Solicitaste restablecer la contraseña de tu cuenta de Dia de partido.</p>
      <p><a href="${resetUrl}">Haz clic aquí para restablecer tu contraseña</a></p>
      <p>Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
    `,
  })
}
