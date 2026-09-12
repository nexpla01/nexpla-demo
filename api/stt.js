export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // req.body is base64 audio + language
    const { audio, language } = req.body;
    
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create form data
    const FormData = (await import('formdata-node')).FormData;
    const { Blob } = await import('buffer');
    
    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    form.append('language_code', language || 'hi-IN');
    form.append('model', 'saarika:v2');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    });

    const data = await response.json();
    return res.status(200).json({ transcript: data.transcript || data.text || '' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
