export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    if (!process.env.SARVAM_API_KEY) {
      console.error('SARVAM_API_KEY is missing');
      return res.status(500).json({ error: 'SARVAM_API_KEY is not configured on Vercel' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    const fileType = mimeType || 'audio/webm';

    let ext = 'webm';
    if (fileType.includes('mp4') || fileType.includes('m4a')) ext = 'mp4';
    else if (fileType.includes('wav')) ext = 'wav';

    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: fileType });
    form.append('file', blob, `audio.${ext}`);
    form.append('model', 'saaras:v3');
    form.append('mode', 'transcribe');
    form.append('language_code', 'unknown');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });

    const raw = await response.text();
    console.log('Sarvam STT status:', response.status, 'body:', raw.slice(0, 500));

    let data;
    try { data = JSON.parse(raw); }
    catch (e) {
      data = { error: { message: raw || 'Non-JSON response from Sarvam' } };
    }

    if (!response.ok) {
      const providerError = data.error || { message: 'Sarvam STT request failed' };
      return res.status(response.status).json({
        error: providerError,
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    const transcript = data.transcript || data.text || data.display_text || '';
    return res.status(200).json({
      transcript,
      language_code: data.language_code || null,
      request_id: data.request_id || null
    });
  } catch (err) {
    console.error('STT error:', err);
    return res.status(500).json({ error: err.message || 'STT proxy error' });
  }
}
