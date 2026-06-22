import Image from "next/image"

// Bandera decorativa (el nombre del equipo/jugador siempre va como texto al
// lado), por eso `alt=""` para no duplicar el anuncio en lectores de pantalla.
export function Flag({ flagUrl }: { flagUrl?: string }) {
  if (!flagUrl) return null
  return (
    <Image
      src={flagUrl}
      alt=""
      width={16}
      height={16}
      className="shrink-0 rounded-sm"
      unoptimized
    />
  )
}
