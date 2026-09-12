export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    const key = process.env.SARVAM_API_KEY;
    if (!key) return res.status(500).json({ error: 'SARVAM_API_KEY is missing in Vercel' });

    const audioBuffer = Buffer.from(audio, 'base64');
    const fileType = mimeType || 'audio/webm';
    const ext = fileType.includes('mp4') || fileType.includes('m4a') ? 'mp4'
              : fileType.includes('wav') ? 'wav' : 'webm';

    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: fileType }), `audio.${ext}`);
    form.append('model', 'saaras:v3');
    form.append('mode', 'transcribe');
    form.append('language_code', 'unknown');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': key },
      body: form
    });

    const raw = await response.text();
    console.log('Sarvam STT:', response.status, raw.slice(0, 500));

    let data = {};
    try { data = JSON.parse(raw); } catch (_) {}

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.error || raw || 'Sarvam STT request failed',
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    return res.status(200).json({
      transcript: data.transcript || '',
      language_code: data.language_code || null,
      request_id: data.request_id || null
    });
  } catch (err) {
    console.error('STT proxy error:', err);
    return res.status(500).json({ error: err.message || 'STT proxy error' });
  }
}
