export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;
    
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: 'hi-IN',
        speaker: 'meera',
        model: 'bulbul:v1',
        enable_preprocessing: true
      })
    });

    const data = await response.json();
    const audio = data.audios && data.audios[0];
    return res.status(200).json({ audio: audio || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
