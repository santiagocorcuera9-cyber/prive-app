// ============================================================
// RUMBO · El cerebro del dossier
// Recibe la consulta en lenguaje natural ("Ginebra del 8 al 15
// de agosto desde CDMX") y le pide a Claude el dossier completo
// en JSON: destino, hoteles ultra high-end, mesas, zona,
// imperdibles, y los datos del vuelo si los mencionó.
// ============================================================

const INSTRUCCIONES = `Eres el curador jefe de Rumbo, una casa de viajes ultra high-end en Ciudad de México. Respondes ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.

Recibirás la petición de viaje de un miembro en lenguaje natural. Genera el dossier del destino con este esquema EXACTO:

{
  "destino": {
    "eyebrow": "Dossier · <región elegante, ej. 'Lago Lemán'>",
    "nombre": "<nombre del destino>",
    "sub": "<2 frases editoriales de por qué y cómo se disfruta, tono de maison de lujo, en español de usted>",
    "fotoQuery": "<consulta en inglés para foto del destino, ej. 'Geneva lake alps'>"
  },
  "viaje": {
    "origenIATA": "<código IATA del aeropuerto de origen si lo mencionó, ej. MEX, si no null>",
    "destinoIATA": "<código IATA del aeropuerto principal del destino, ej. GVA, si no null>",
    "fechaSalida": "<YYYY-MM-DD si mencionó fechas, si no null>",
    "fechaRegreso": "<YYYY-MM-DD o null>",
    "resumen": "<ej. '8 — 15 de agosto · desde Ciudad de México' o null>"
  },
  "hoteles": [ 3 objetos:
    {"marca": "<casa: Four Seasons / Aman / Belmond / Mandarin Oriental / Peninsula / One&Only / St. Regis / Ritz-Carlton / Bulgari / Rosewood / o la gran casa local histórica equivalente>",
     "nombre": "<nombre exacto del hotel>",
     "nota": "<1-2 frases de por qué esta casa, tono editorial>",
     "fotoQuery": "<consulta en inglés para foto, ej. 'luxury hotel suite lake view'>"}
  ],
  "mesas": [ 3 a 5 objetos:
    {"nombre": "<restaurante real de primer nivel del destino>",
     "tipo": "<ej. 'Alta cocina · 3 estrellas' o 'Institución local'>",
     "nota": "<1-2 frases: qué pedir o por qué ir>"}
  ],
  "zona": {"nombre": "<la zona más exclusiva de la ciudad, ej. 'Rue du Rhône'>",
           "nota": "<1-2 frases: qué hay ahí>"},
  "imperdibles": [ "<4 experiencias de alto nivel, frases cortas>" ]
}

Reglas estrictas:
- SOLO hoteles verdaderamente ultra high-end (5 estrellas, las casas listadas o palacios históricos equivalentes como Beau-Rivage o Gstaad Palace). Jamás cadenas medias.
- Restaurantes y lugares REALES y vigentes. Si no estás seguro de que existe, no lo incluyas.
- Español elegante de usted. Nada de emojis ni exclamaciones.
- Si el destino es demasiado ambiguo, responde: {"error":"<pregunta breve para precisar>"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  try {
    const { consulta } = req.body || {};
    if (!consulta) return res.status(400).json({ error: "Falta la consulta." });
    if (!process.env.ANTHROPIC_API_KEY)
      return res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en Vercel." });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2500,
        system: INSTRUCCIONES,
        messages: [{ role: "user", content: consulta }],
      }),
    });

    if (!r.ok) {
      const e = await r.text();
      return res.status(502).json({ error: "El curador no respondió.", detalle: e });
    }

    const data = await r.json();
    const texto = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let dossier;
    try {
      dossier = JSON.parse(texto);
    } catch {
      return res.status(502).json({ error: "Respuesta ilegible del curador. Intente de nuevo." });
    }

    res.status(200).json(dossier);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
