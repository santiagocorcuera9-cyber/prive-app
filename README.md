# RUMBO · La aplicación real (v1.0)

Escribe cualquier viaje en lenguaje natural — "Quiero ir a Ginebra
del 8 al 15 de agosto volando desde Ciudad de México" — y la casa
responde con el dossier completo: hoteles ultra high-end, mesas,
la zona, imperdibles, fotografías reales y vuelos propuestos.

## Los tres motores

- `api/dossier.js` — EL CEREBRO. Le pide a Claude (API de Anthropic)
  el dossier del destino en JSON estricto, con reglas de curaduría:
  solo Four Seasons, Aman, Belmond, Mandarin Oriental, Peninsula,
  One&Only, St. Regis, Ritz-Carlton, Bulgari, Rosewood o palacios
  históricos equivalentes. Funciona con cualquier destino del mundo.
- `api/photos.js` — LAS FOTOS. Busca en Pexels (licencia libre para
  uso comercial) la fotografía del destino y de cada hotel.
- `api/flights.js` — LOS VUELOS. Duffel, igual que antes. Si tu
  consulta trae fechas y origen, propone los 3 mejores vuelos.

## Llaves necesarias (3, dos gratis y una de centavos)

1. **ANTHROPIC_API_KEY** — console.anthropic.com → crea cuenta →
   API Keys → Create Key. Es de pago por uso: cada dossier cuesta
   unos cuantos centavos de dólar. Carga $5 USD y te alcanza para
   cientos de dossiers.
2. **PEXELS_KEY** — pexels.com/api → cuenta gratis → tu API key.
   Gratis, 200 búsquedas/hora. (Fotos de destino y respaldo.)
2b. **GOOGLE_PLACES_KEY** (opcional pero recomendada) — la que trae
   las fotos REALES de cada hotel, cuarto y restaurante (las de
   Google Maps). En console.cloud.google.com: crea un proyecto,
   habilita "Places API (New)", crea una API key y agrega tarjeta
   (tiene cuota mensual gratuita generosa; con tu volumen inicial
   no deberías pagar). Sin esta llave, la página usa Pexels.
3. **DUFFEL_TOKEN** — el que ya tienes de duffel.com (modo Test).

## Desplegar (igual que siempre)

1. Sube esta carpeta a un repositorio nuevo en GitHub: `prive-app`.
2. En vercel.com: Add New → Project → prive-app → Deploy.
3. Settings → Environment Variables: agrega las 3 llaves de arriba
   con esos nombres exactos.
4. Redeploy. Listo: escribe "Ginebra del 8 al 15 de agosto desde
   CDMX" y mira la magia.

## Notas honestas

- Las fotos de Pexels son del DESTINO y de "hotel de lujo" genérico
  espectacular — no del hotel exacto. Para la foto real de la
  alberca del Caruso, la fase siguiente es la API de Google Places
  (fotos licenciadas de cada lugar) o los press kits oficiales de
  los hoteles cuando seas agencia registrada.
- El curador (Claude) recomienda lugares reales, pero verifica
  horarios y aperturas antes de prometer a un cliente: los
  restaurantes cambian. La regla de la casa: nada se promete sin
  confirmar.
- Los vuelos siguen en modo Test de Duffel (aparecen aerolíneas de
  prueba). Cuando el flujo completo esté listo, activamos Live.

## Costos mensuales reales de operar esto

- Vercel: gratis en este nivel de tráfico.
- Pexels: gratis.
- Anthropic: ~$0.02–0.05 USD por dossier generado.
- Duffel test: gratis.
Total: prácticamente cero hasta que tengas clientes. Como debe ser.
