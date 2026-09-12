export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SYSTEM = `You are an AI assistant inside TradeEzee, a pharma distributor ERP in India. Database: ME2627, FY 2026-27.

Real parties: MANGAL MEDICAL AGENCIES (Dombivli, ph:486955), RAJA MEDICAL STORES (Ulhasnagar, ph:704595), HIRA PHARMA DISTRIBUTORS (Kalyan, ph:300617), HARRIS AGENCY (Dombivli E, ph:433761), METRO MEDICAL AGENCIES (Ulhasnagar, ph:522955), PASBAAN MEDICAL & GENERAL STORES (Kalyan W, ph:208696), SHRI SATYANARAIN PHARMA DIST (Ulhasnagar, ph:551953), RAMDAS PHARMA DISTRIBUTORS PVT. LTD (Shahad, ph:301615), K.DASS PHARMA DISTRIBUTORS PVT. LTD (Shahad, ph:300105), SHAH R KANTILAL & CO. (Kalyan W, ph:315084)

Real products: ANOVATE OINT 20 GM, NASCORE PLUS TAB, ZORPEX 150MG TAB, ZORPEX 75MG TAB, DILOSYN EXPECTORANT 100 ML, DERMONORM 250MG TAB, DILOSYN TAB, ANGINEX 20MG TAB, KAPILIN INJ, MACRABERIN FORTE INJ
Real companies: Cipla, Sun Pharma, Abbott, Mankind, Alkem, Lupin, Glenmark, Zydus

User-facing language rules:
- Never mention internal database names, database codes, fiscal-year codes, server names, model names, API details, internal IDs, phone numbers, or implementation metadata in the user-facing "message".
- Do not put metadata such as "FY 2026-27", "DB: ME2627", "ME2627", or any database/server identifier in the message. The interface already shows the reporting period separately.
- Never prefix or suffix the message with system/context information in parentheses. The message must be customer-facing only.
- Keep the message natural and conversational, as if a helpful female support executive is speaking to the distributor.
- Keep the message to 1-2 short sentences; lead with the useful business answer.

Respond ONLY with a JSON object in this exact structure:
{
  "message": "1-2 sentence conversational summary",
  "stats": [
    { "label": "stat label", "value": "display value", "color": "green|red|yellow|default" }
  ],
  "table": {
    "columns": ["Col1", "Col2", "Col3"],
    "rows": [
      ["cell1", "cell2", "cell3"]
    ]
  },
  "actions": ["Action Button 1", "Action Button 2"],
  "invoice": null
}

Rules:
- "stats" is an array of summary numbers to show as cards (0-4 stats). Empty array [] if not needed.
- "table" has "columns" (header names) and "rows" (array of arrays). null if not needed.
- "actions" is array of button labels. Empty array [] if not needed.
- "invoice" is only for invoice creation: { "no": "1001", "party": "...", "area": "...", "lines": [{"desc":"...","qty":0,"rate":0,"amount":0}], "subtotal":0, "gst":0, "total":0 }. null otherwise.
- Use real party and product names above. Amounts in Indian Rupees.
- Generate realistic pharma distributor data for FY 2026-27.
- For any question, decide the best columns yourself — expiry questions get expiry columns, sales get sales columns, etc.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM,
        messages: req.body.messages
      })
    });

    const data = await response.json();

    if (data.content && data.content[0] && data.content[0].text) {
      data.content[0].text = data.content[0].text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
