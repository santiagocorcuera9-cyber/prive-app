// ============================================================
// RUMBO · Fotografía (v2)
// Jerarquía: 1) Google Places → foto REAL del lugar exacto
//            2) Pexels → foto espectacular del destino/tema
//            3) null → el marco elegante de la interfaz
// GET /api/photos?q=Grand+Hotel+Quisisana+Capri&tipo=lugar
//   tipo=lugar  → intenta Google Places primero (hoteles, restaurantes)
//   tipo=escena → va directo a Pexels (paisajes del destino)
// ============================================================

async function googlePlaces(q) {
  if (!process.env.GOOGLE_PLACES_KEY) return null;
  try {
    // 1. Buscar el lugar por nombre
    const b = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_KEY,
        "X-Goog-FieldMask": "places.photos,places.displayName",
      },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1 }),
    });
    if (!b.ok) return null;
    const data = await b.json();
    const fotoName = data.places?.[0]?.photos?.[0]?.name;
    if (!fotoName) return null;

    // 2. Obtener la URL de la foto (sin exponer la llave al navegador)
    const m = await fetch(
      `https://places.googleapis.com/v1/${fotoName}/media?maxWidthPx=1400&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_KEY } }
    );
    if (!m.ok) return null;
    const media = await m.json();
    return media.photoUri ? { url: media.photoUri, credito: "Google" } : null;
  } catch { return null; }
}

async function pexels(q) {
  if (!process.env.PEXELS_KEY) return null;
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_KEY } }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const foto = data.photos?.[0];
    return foto ? { url: foto.src.large2x || foto.src.large, credito: foto.photographer + " vía Pexels" } : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  const { q, tipo = "escena", alt } = req.query;
  if (!q) return res.status(400).json({ error: "Falta el parámetro q." });

  let foto = null;
  if (tipo === "lugar") foto = await googlePlaces(q);
  if (!foto) foto = await pexels(alt || q);

  res.status(200).json(foto || { url: null });
}
