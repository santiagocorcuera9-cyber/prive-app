// ============================================================
// RUMBO · Fotografía (v3)
// Jerarquía: 1) Google Places → foto REAL del lugar exacto,
//               priorizando fotos oficiales del negocio y
//               descartando retratos/selfies de huéspedes
//            2) Pexels → foto espectacular del destino/tema
//            3) null → el marco elegante de la interfaz
// ============================================================

// Palabras en el nombre del autor que delatan foto de huésped/persona
// (las fotos oficiales suelen venir atribuidas al propio hotel).
function pareceDePersona(attr) {
  if (!attr) return false;
  const nombre = (attr.displayName || "").toLowerCase();
  // Fotos oficiales suelen incluir el nombre del hotel o palabras de negocio
  const esNegocio = /hotel|resort|palace|collection|kempinski|four seasons|rosewood|mandarin|ritz|anantara|marriott|hyatt/.test(nombre);
  if (esNegocio) return false;
  // Si el "autor" es dos palabras tipo Nombre Apellido, probablemente es un huésped
  const palabras = nombre.trim().split(/\s+/);
  return palabras.length <= 3; // nombres de persona: 2-3 palabras
}

async function googlePlaces(q) {
  if (!process.env.GOOGLE_PLACES_KEY) return null;
  try {
    // Buscamos el lugar y pedimos hasta 10 fotos con su atribución de autor
    const b = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_KEY,
        "X-Goog-FieldMask": "places.photos.name,places.photos.widthPx,places.photos.heightPx,places.photos.authorAttributions,places.displayName",
      },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1 }),
    });
    if (!b.ok) return null;
    const data = await b.json();
    const fotos = data.places?.[0]?.photos || [];
    if (!fotos.length) return null;

    // Ordenar: primero las que NO parecen de persona, luego el resto.
    // Además preferimos fotos anchas (más probable que sean del edificio/espacio).
    const ordenadas = [...fotos].sort((a, b2) => {
      const aPersona = pareceDePersona(a.authorAttributions?.[0]) ? 1 : 0;
      const bPersona = pareceDePersona(b2.authorAttributions?.[0]) ? 1 : 0;
      if (aPersona !== bPersona) return aPersona - bPersona;
      // a igualdad, la más ancha primero (paisaje > retrato)
      const ar = (a.widthPx || 0) / (a.heightPx || 1);
      const br = (b2.widthPx || 0) / (b2.heightPx || 1);
      return br - ar;
    });

    // Tomamos la primera aceptable que sea horizontal-ish
    const elegida = ordenadas.find(f => (f.widthPx || 0) >= (f.heightPx || 0)) || ordenadas[0];
    if (!elegida?.name) return null;

    const m = await fetch(
      `https://places.googleapis.com/v1/${elegida.name}/media?maxWidthPx=1400&skipHttpRedirect=true`,
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
