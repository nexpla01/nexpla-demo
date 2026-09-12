export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const key = process.env.SARVAM_API_KEY;
    if (!key) return res.status(500).json({ error: 'SARVAM_API_KEY is missing in Vercel' });

    const payload = {
      text: String(text).slice(0, 1500),
      model: 'bulbul:v2',
      speaker: 'anushka',
      language_code: 'en-IN',
      speech_sample_rate: 22050,
      output_audio_codec: 'wav',
      enable_preprocessing: true
    };

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': key
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    console.log('Sarvam TTS:', response.status, raw.slice(0, 500));

    let data = {};
    try { data = JSON.parse(raw); } catch (_) {}

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.error || raw || 'Sarvam TTS request failed',
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    if (!data.audios || !data.audios[0]) {
      return res.status(502).json({
        error: 'Sarvam returned success but no audio',
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    return res.status(200).json({
      audio: data.audios[0],
      request_id: data.request_id || null
    });
  } catch (err) {
    console.error('TTS proxy error:', err);
    return res.status(500).json({ error: err.message || 'TTS proxy error' });
  }
}
