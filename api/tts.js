export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const payload = {
      text: text.slice(0, 500),
      model: 'bulbul:v3',
      speaker: 'meera',
      target_language_code: 'en-IN',
      speech_sample_rate: 22050
    };

    console.log('Calling Sarvam TTS with:', JSON.stringify(payload));

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    console.log('Sarvam TTS status:', response.status);
    console.log('Sarvam TTS body preview:', raw.slice(0, 300));

    let data;
    try { data = JSON.parse(raw); } catch(e) { 
      return res.status(500).json({ error: 'Invalid JSON from Sarvam: ' + raw.slice(0, 100) });
    }

    if (!data.audios || !data.audios[0]) {
      console.log('No audio in response:', JSON.stringify(data));
      return res.status(200).json({ audio: null, debug: data });
    }

    return res.status(200).json({ audio: data.audios[0] });

  } catch (err) {
    console.error('TTS error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
