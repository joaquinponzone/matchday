# Pozo de Premios — Prode Mundialista 2026

Sistema de entrada paga opcional para el prode mundialista. Los usuarios que abonan una entrada única se suman al pozo de premios. Al finalizar el Mundial, los 3 primeros del ranking se reparten el pozo según los porcentajes configurados por el admin. Los usuarios que no pagan pueden igualmente jugar el prode en modo libre (sin opción a ganar el premio).

---

## Conceptos clave

| Concepto | Descripción |
|----------|-------------|
| **Modo libre** | Cualquier usuario activo puede cargar predicciones y aparecer en el leaderboard sin pagar |
| **Modo premium / entrant** | Usuario que pagó la entrada; participa en el pozo de premios |
| **Pozo** | Suma de todas las entradas pagas. El admin lo distribuye manualmente al finalizar el Mundial |
| **Entrant** | Registro en `prode_entries` con `status = 'paid'` |
| **Distribución** | Porcentajes configurables por el admin (1°/2°/3°). La suma debe ser 100% |

---

## Modelo de datos

### Tabla `prode_entries`

Registra el intento y confirmación de pago de cada usuario.

```sql
CREATE TABLE prode_entries (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  amount           INTEGER NOT NULL,                    -- en centavos ARS (ej: 500000 = $5.000)
  status           TEXT NOT NULL DEFAULT 'pending',    -- pending | paid | refunded
  talo_payment_id  TEXT,                               -- ID de orden en Talo (llega al crear la orden)
  external_id      TEXT NOT NULL,                      -- UUID generado por nosotros para correlación
  paid_at          TEXT,                               -- ISO 8601, seteado por webhook de Talo
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (user_id)                                     -- un pago por usuario (una sola entrada)
);
```

**Notas:**
- `external_id` es un UUID v4 generado en `POST /api/payments/prode/create` antes de llamar a Talo. Es el link entre nuestro registro y la orden de Talo.
- `talo_payment_id` se guarda en la respuesta del `POST /payments/` de Talo.
- El webhook de Talo usa `external_id` para encontrar el registro local y marcar `status = 'paid'`.
- La constraint `UNIQUE (user_id)` impide que un usuario genere múltiples entradas. Si la entrada está en `pending`, se reutiliza.

---

### Tabla `prode_config`

Configuración global del pozo (una sola fila).

```sql
CREATE TABLE prode_config (
  id                 INTEGER PRIMARY KEY DEFAULT 1,    -- single row
  entry_fee_ars      INTEGER NOT NULL DEFAULT 500000,  -- en centavos (500000 = ARS 5.000)
  prize_pct_1st      INTEGER NOT NULL DEFAULT 50,      -- porcentaje para 1° lugar
  prize_pct_2nd      INTEGER NOT NULL DEFAULT 30,      -- porcentaje para 2° lugar
  prize_pct_3rd      INTEGER NOT NULL DEFAULT 20,      -- porcentaje para 3° lugar
  registration_open  INTEGER NOT NULL DEFAULT 1,       -- 0 = cerrado, 1 = abierto
  prizes_distributed INTEGER NOT NULL DEFAULT 0,       -- 0 = pendiente, 1 = distribuido
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
```

**Notas:**
- `prize_pct_1st + prize_pct_2nd + prize_pct_3rd` debe sumar 100. Validar en el admin form.
- `registration_open = 0` oculta el CTA de pago y muestra "Inscripción cerrada".
- `prizes_distributed = 1` indica que el admin ya distribuyó manualmente el dinero. Activa un banner de "¡Premios entregados!" en el prode.

---

## Integración Talo Pay

Talo Pay es un proveedor argentino que acepta pagos en ARS vía transferencia bancaria y en crypto. No requiere que los usuarios tengan cuenta en Talo.

**Documentación:** https://docs.talo.com.ar

**Endpoints:**
- Producción: `https://api.talo.com.ar`
- Sandbox: `https://sandbox-api.talo.com.ar`

---

### Autenticación con Talo

Talo usa OAuth 2.0. Se necesita obtener un access token antes de cada llamada (o cachear con refresh).

```
POST /auth/tokens
Body: { partner_id, client_secret }
Response: { access_token: "PAR-..." }
```

---

### Flujo de pago completo

```
1. Usuario hace click en "Entrar al pozo de premios"
   └─ Frontend llama POST /api/payments/prode/create (autenticado)

2. Backend (create route):
   a. getUser() → verificar sesión y que el usuario está activo
   b. Verificar que registration_open = 1 en prode_config
   c. Verificar que no existe prode_entry con status = 'paid' para este user
   d. Generar external_id (UUID v4)
   e. Obtener access token de Talo
   f. POST https://api.talo.com.ar/payments/ con:
      { amount, currency: "ARS", external_id, webhook_url }
   g. Guardar/actualizar prode_entry { user_id, amount, status: 'pending',
      talo_payment_id, external_id }
   h. Retornar { payment_url } al frontend

3. Frontend redirige al usuario a payment_url (Talo hosted checkout)

4. Usuario selecciona método y completa el pago en Talo
   └─ Opciones: transferencia bancaria ARS, crypto

5. Talo dispara POST /api/webhooks/talo (nuestro webhook handler):
   Body: { paymentId, externalId, message }

6. Webhook handler:
   a. Buscar prode_entry por external_id → verificar que existe
   b. GET https://api.talo.com.ar/payments/{paymentId} → verificar status
   c. Si status = paid:
      → UPDATE prode_entries SET status='paid', paid_at=now() WHERE external_id=...
   d. Responder 200 OK inmediatamente (no bloquear)

7. Usuario redirigido por Talo a:
   /world-cup/prode?payment=success   (éxito)
   /world-cup/prode?payment=cancelled (canceló)
```

---

### Variables de entorno nuevas

```bash
TALO_PARTNER_ID       # ID del partner en Talo
TALO_CLIENT_SECRET    # Secret para obtener access token
TALO_WEBHOOK_SECRET   # Para validar HMAC cuando Talo lo implemente (preparar ya)
```

---

### API Routes nuevas

#### `POST /api/payments/prode/create`

- **Auth:** Requiere sesión activa (`verifySession()`)
- **Protecciones:** `registration_open`, `status !== 'paid'` ya, usuario activo
- **Respuesta:** `{ payment_url: string }` o `{ error: string }`

#### `POST /api/webhooks/talo`

- **Auth:** Ninguna por ahora (Talo no implementó HMAC aún). Verificar `externalId` existe en DB.
- **Lógica:** Lookup por `external_id` → GET /payments/{paymentId} en Talo → update DB
- **Respuesta:** `200 OK` inmediato, procesamiento async si es necesario

---

## UI / UX

### Banner de pozo — `/world-cup/prode`

Se muestra arriba del área de predicciones. Tiene 3 estados:

**Estado: inscripción abierta, usuario no pagó**
```
┌─────────────────────────────────────────────────────────┐
│  Pozo de premios: $47.500 ARS                           │
│  12 participantes · Entrada: $5.000 ARS                 │
│  [ Entrar al pozo de premios → ]                        │
└─────────────────────────────────────────────────────────┘
```

**Estado: usuario ya pagó**
```
┌─────────────────────────────────────────────────────────┐
│  ✓ Participando por el premio                           │
│  Pozo actual: $47.500 ARS · 12 participantes            │
│  1° ~$23.750  |  2° ~$14.250  |  3° ~$9.500            │
└─────────────────────────────────────────────────────────┘
```

**Estado: inscripción cerrada**
```
┌─────────────────────────────────────────────────────────┐
│  Inscripción cerrada                                    │
│  Pozo final: $47.500 ARS · 12 participantes            │
│  1° ~$23.750  |  2° ~$14.250  |  3° ~$9.500            │
└─────────────────────────────────────────────────────────┘
```

**Estado: premios distribuidos**
```
┌─────────────────────────────────────────────────────────┐
│  Premios entregados                                     │
│  Felicitaciones a los ganadores del pozo 2026           │
└─────────────────────────────────────────────────────────┘
```

---

### Modal de pago

Se abre al hacer click en "Entrar al pozo de premios":

```
┌───────────────────────────────────────┐
│  Entrar al Pozo de Premios            │
│                                       │
│  Monto de entrada: $5.000 ARS         │
│                                       │
│  Distribución del pozo:               │
│  🥇 1° lugar · 50% del pozo           │
│  🥈 2° lugar · 30% del pozo           │
│  🥉 3° lugar · 20% del pozo           │
│                                       │
│  Tu pago se realiza una sola vez.     │
│  Sin suscripciones.                   │
│                                       │
│  [ Pagar con Talo →  ]                │
│  [ Cancelar ]                         │
└───────────────────────────────────────┘
```

---

### Leaderboard — cambios

- Añadir un ícono de trofeo (🏆) o badge "PREMIO" junto al nickname de los usuarios que pagaron.
- Los usuarios en modo libre aparecen normalmente sin distinción especial.
- Al pie del leaderboard, si hay al menos 1 entrant, mostrar una sección de premios estimados:

```
Distribución estimada del pozo ($47.500 ARS):
🥇 Juan · 50% · ~$23.750
🥈 María · 30% · ~$14.250
🥉 Carlos · 20% · ~$9.500
```

Solo se muestra si los 3 primeros del ranking actual son entrants. Si alguno no pagó, mostrar "Sin premio asignado" para esa posición.

---

### Página `/admin/prode` (nueva)

Accesible solo para admins. Link en `nav-links.tsx` dentro del grupo admin.

```
┌──────────────────────────────────────────────────────────┐
│  Configuración del Prode                                 │
│                                                          │
│  Monto de entrada:  [ $5.000 ARS ]                       │
│  Inscripción:       [ Abierta  ▼ ]                       │
│  Distribución:      1° [ 50 ]%  2° [ 30 ]%  3° [ 20 ]%  │
│                     (debe sumar 100%)                    │
│  [ Guardar configuración ]                               │
├──────────────────────────────────────────────────────────┤
│  Pozo total: $47.500 ARS (12 entrants pagos)             │
│                                                          │
│  Distribución actual:                                    │
│  🥇 Juan    · 1° lugar · $23.750 ARS                     │
│  🥈 María   · 2° lugar · $14.250 ARS                     │
│  🥉 Carlos  · 3° lugar · $9.500 ARS                      │
├──────────────────────────────────────────────────────────┤
│  Entrants (12)                                           │
│  ─────────────────────────────────────────────────────   │
│  Juan     $5.000  ✓ paid    2026-06-01                   │
│  María    $5.000  ✓ paid    2026-06-02                   │
│  Pedro    $5.000  ⏳ pending  —                           │
│  Ana      $5.000  ↩ refunded  —                          │
├──────────────────────────────────────────────────────────┤
│  [ Marcar premios como distribuidos ]                    │
└──────────────────────────────────────────────────────────┘
```

---

## Estados y transiciones de `prode_entries.status`

```
[sin entry]
    │
    ▼  POST /api/payments/prode/create
[pending]
    │
    ├──▶ [paid]      ← webhook de Talo confirma pago
    │
    └──▶ [refunded]  ← admin marca manualmente desde /admin/prode
```

**Reglas:**
- `pending → paid`: solo vía webhook de Talo, verificando con GET /payments/{id}
- `paid → refunded`: solo manual por admin (no hay API de Talo para esto en el spec actual)
- Si un usuario tiene entry en `pending` y vuelve a hacer click en "Pagar", se reutiliza el mismo `talo_payment_id`/`external_id` (no se crea una nueva entrada)

---

## Queries DB nuevas (`queries.ts`)

```ts
// Obtener config del prode (crea la fila si no existe)
getProdeConfig(): Promise<ProdeConfig>

// Actualizar config (admin)
updateProdeConfig(config: Partial<ProdeConfig>): Promise<void>

// Obtener entry de un usuario
getUserProdeEntry(userId: number): Promise<ProdeEntry | null>

// Crear o reutilizar entry pendiente
upsertProdeEntry(entry: { userId, amount, externalId, taloPaymentId }): Promise<ProdeEntry>

// Confirmar pago (llamado por webhook)
confirmProdeEntry(externalId: string, taloPaymentId: string): Promise<void>

// Obtener todos los entrants (para admin)
getProdeEntrants(): Promise<(ProdeEntry & { userName: string })[]>

// Marcar premios como distribuidos
markPrizesDistributed(): Promise<void>

// Refundar entry (admin)
refundProdeEntry(userId: number): Promise<void>
```

---

## Estructura de archivos

```
src/
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   └── prode/
│   │   │       └── create/
│   │   │           └── route.ts       # POST — crea orden en Talo
│   │   └── webhooks/
│   │       └── talo/
│   │           └── route.ts           # POST — confirma pago de Talo
│   └── (app)/
│       ├── admin/
│       │   └── prode/
│       │       └── page.tsx           # Panel admin del prode
│       └── world-cup/
│           └── prode/
│               ├── prize-pool-banner.tsx  # Banner del pozo [client]
│               └── payment-modal.tsx      # Modal de pago [client]
├── server/
│   └── db/
│       ├── schema.ts                  # + prode_entries, prode_config
│       └── queries.ts                 # + queries de membresía
```

---

## Consideraciones

### Pagos duplicados / reintentos
Si un usuario tiene entry en `pending` y vuelve a intentar pagar, reutilizar la misma entrada (y generar una nueva orden en Talo si la anterior expiró). Si ya está en `paid`, retornar error "Ya sos parte del pozo de premios".

### Webhook recibido antes que la respuesta de create
Race condition posible si el pago es instantáneo. El webhook debe poder crear el entry si no existe, o actualizarlo si existe en pending.

### Talo HMAC (futuro)
Talo va a implementar firma HMAC en los webhooks. Preparar la env var `TALO_WEBHOOK_SECRET` y dejar un comentario `// TODO: validar X-Talo-Signature` en el webhook handler para activarlo cuando esté disponible.

### Reembolsos
No hay integración automática de reembolsos con Talo en este spec. El admin marca la entrada como `refunded` en el panel, y gestiona la devolución del dinero fuera del sistema (transferencia manual).

### Cierre de inscripción
El admin cierra la inscripción (`registration_open = 0`) antes de la final del Mundial. Después de eso, el ranking determina ganadores y el admin distribuye manualmente.

### Usuarios sin predicciones
Un usuario puede pagar y no cargar predicciones (termina con 0 pts). Aparece en el leaderboard de entrants pero en último lugar. No hay exclusión automática.

### Empate en el top 3
Si dos entrants empatan en la misma posición (mismo total, exactos y timestamp), ambos comparten el mismo puesto. El admin decide cómo dividir ese tramo del pozo.

---

## Estado de implementación

- [ ] Schema: tablas `prode_entries` y `prode_config` + migración
- [ ] Queries: todas las queries listadas arriba
- [ ] API Route: `POST /api/payments/prode/create`
- [ ] API Route: `POST /api/webhooks/talo`
- [ ] UI: `prize-pool-banner.tsx` (3 estados + premio distribuido)
- [ ] UI: `payment-modal.tsx` (modal con info de distribución + botón Talo)
- [ ] UI: leaderboard — badge de entrant + sección de premios estimados
- [ ] UI: `/admin/prode` — configuración + lista de entrants + distribución
- [ ] Nav: link a `/admin/prode` en nav-links para admins
- [ ] Env vars: `TALO_PARTNER_ID`, `TALO_CLIENT_SECRET`, `TALO_WEBHOOK_SECRET`
