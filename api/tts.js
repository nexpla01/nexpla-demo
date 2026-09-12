export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        model: 'bulbul:v2',
        speaker: 'anushka',
        target_language_code: 'en-IN',
        enable_preprocessing: true,
        speech_sample_rate: 22050
      })
    });

    const raw = await response.text();
    console.log('Sarvam TTS status:', response.status, 'body:', raw.slice(0, 200));

    let data;
    try { data = JSON.parse(raw); } catch(e) { data = {}; }

    const audio = data.audios && data.audios[0];
    return res.status(200).json({ audio: audio || null, error: data.error || null });

  } catch (err) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: err.message });
  }
}
