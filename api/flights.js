// ============================================================
// RUMBO · Motor de búsqueda de vuelos (v0.2 — Duffel)
// Amadeus Self-Service cerró el 17/jul/2026, así que el motor
// ahora usa Duffel: registro self-serve, sandbox inmediato, y
// además nos permitirá reservar DENTRO de la app más adelante.
// ============================================================

// Aerolíneas → página oficial (agrega más cuando quieras)
const OFICIALES = {
  AM: { nombre: "Aeroméxico",      url: "https://aeromexico.com" },
  Y4: { nombre: "Volaris",         url: "https://www.volaris.com" },
  VB: { nombre: "Viva Aerobus",    url: "https://www.vivaaerobus.com" },
  UA: { nombre: "United",          url: "https://www.united.com" },
  AA: { nombre: "American",        url: "https://www.aa.com" },
  DL: { nombre: "Delta",           url: "https://www.delta.com" },
  AV: { nombre: "Avianca",         url: "https://www.avianca.com" },
  CM: { nombre: "Copa Airlines",   url: "https://www.copaair.com" },
  IB: { nombre: "Iberia",          url: "https://www.iberia.com" },
  AF: { nombre: "Air France",      url: "https://www.airfrance.com.mx" },
  LH: { nombre: "Lufthansa",       url: "https://www.lufthansa.com" },
  BA: { nombre: "British Airways", url: "https://www.britishairways.com" },
  AC: { nombre: "Air Canada",      url: "https://www.aircanada.com" },
  B6: { nombre: "JetBlue",         url: "https://www.jetblue.com" },
  WN: { nombre: "Southwest",       url: "https://www.southwest.com" },
  ZZ: { nombre: "Duffel Airways",  url: "https://duffel.com" }, // aerolínea de prueba del sandbox
};

export default async function handler(req, res) {
  try {
    const { origen, destino, fecha, adultos = "1" } = req.query;

    if (!origen || !destino || !fecha) {
      return res.status(400).json({ error: "Faltan datos: origen, destino y fecha son obligatorios." });
    }
    if (!process.env.DUFFEL_TOKEN) {
      return res.status(500).json({ error: "Falta configurar DUFFEL_TOKEN en Vercel (Settings → Environment Variables)." });
    }

    // Una sola llamada: creamos la búsqueda y pedimos las ofertas de regreso
    const r = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DUFFEL_TOKEN}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          slices: [
            {
              origin: origen.toUpperCase(),       // ej. MEX
              destination: destino.toUpperCase(), // ej. CUN
              departure_date: fecha,              // ej. 2026-12-15
            },
          ],
          passengers: Array.from({ length: parseInt(adultos) }, () => ({ type: "adult" })),
          cabin_class: "economy",
        },
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg = err?.errors?.[0]?.message || "Duffel respondió con error.";
      return res.status(502).json({ error: msg });
    }

    const data = await r.json();
    const offers = data?.data?.offers || [];

    const vuelos = offers.slice(0, 15).map((o) => {
      const slice = o.slices[0];
      const segs = slice.segments;
      const primero = segs[0];
      const ultimo = segs[segs.length - 1];
      const codigo = o.owner?.iata_code || primero.operating_carrier?.iata_code || "??";
      const oficial = OFICIALES[codigo];

      return {
        aerolinea: o.owner?.name || oficial?.nombre || codigo,
        codigo,
        precio: parseFloat(o.total_amount),
        moneda: o.total_currency,
        salida: primero.departing_at,
        llegada: ultimo.arriving_at,
        duracion: (slice.duration || "").replace("PT", "").replace("H", "h ").replace("M", "m").toLowerCase(),
        escalas: segs.length - 1,
        linkOficial: oficial?.url || null,
        fuente: oficial ? "Página oficial disponible" : "Solo vía agencia",
        // Guardamos el id de la oferta: es lo que usaremos en la
        // Fase 3 para reservar DENTRO de Rumbo con Duffel Orders.
        offerId: o.id,
      };
    });

    res.status(200).json({ total: vuelos.length, vuelos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
