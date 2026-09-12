export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    const audioBuffer = Buffer.from(audio, 'base64');
    const fileType = mimeType || 'audio/webm';
    const ext = fileType.includes('mp4') ? 'mp4' : 'webm';

    // Native FormData - no imports needed in Node 18+
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: fileType });
    form.append('file', blob, `audio.${ext}`);
    form.append('model', 'saaras:v3');
    form.append('mode', 'transcribe');
    form.append('language_code', 'unknown'); // auto-detect Hindi or English

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });

    const text = await response.text();
    console.log('Sarvam STT status:', response.status, 'body:', text);

    let data;
    try { data = JSON.parse(text); } catch(e) { data = {}; }

    const transcript = data.transcript || data.text || data.display_text || '';
    return res.status(200).json({ transcript });

  } catch (err) {
    console.error('STT error:', err);
    return res.status(500).json({ error: err.message });
  }
}
