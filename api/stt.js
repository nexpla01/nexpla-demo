export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, language, mimeType } = req.body;
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length, 'mimeType:', mimeType);

    // Use native fetch FormData (Node 18+)
    const { FormData, File } = await import('formdata-node');
    
    const form = new FormData();
    const ext = (mimeType || 'audio/webm').includes('mp4') ? 'mp4' : 'webm';
    const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType || 'audio/webm' });
    form.append('file', file);
    form.append('language_code', language || 'hi-IN');
    form.append('model', 'saarika:v2');

    console.log('Sending to Sarvam STT...');
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });

    const text = await response.text();
    console.log('Sarvam STT response status:', response.status, 'body:', text);

    let data;
    try { data = JSON.parse(text); } catch(e) { data = { transcript: text }; }

    return res.status(200).json({ 
      transcript: data.transcript || data.text || data.display_text || ''
    });
  } catch (err) {
    console.error('STT error:', err);
    return res.status(500).json({ error: err.message });
  }
}
