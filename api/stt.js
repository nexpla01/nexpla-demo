export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, language, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    const audioBuffer = Buffer.from(audio, 'base64');
    const ext = (mimeType || 'audio/webm').includes('mp4') ? 'mp4' : 'webm';
    const fileType = mimeType || 'audio/webm';

    // Use native FormData (Node 18+, no imports needed)
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: fileType });
    form.append('file', blob, `audio.${ext}`);
    form.append('language_code', language || 'hi-IN');
    form.append('model', 'saarika:v2');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });

    const text = await response.text();
    console.log('Sarvam STT status:', response.status, 'body:', text);

    let data;
    try { data = JSON.parse(text); } catch(e) { data = {}; }

    return res.status(200).json({
      transcript: data.transcript || data.text || data.display_text || ''
    });
  } catch (err) {
    console.error('STT error:', err);
    return res.status(500).json({ error: err.message });
  }
}
