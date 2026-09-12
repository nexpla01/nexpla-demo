export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'No text provided' });

    if (!process.env.SARVAM_API_KEY) {
      console.error('SARVAM_API_KEY is missing');
      return res.status(500).json({ error: 'SARVAM_API_KEY is not configured on Vercel' });
    }

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        text: String(text).slice(0, 1500),
        model: 'bulbul:v2',
        speaker: 'anushka',
        language_code: 'en-IN',
        enable_preprocessing: true,
        speech_sample_rate: 22050,
        output_audio_codec: 'wav'
      })
    });

    const raw = await response.text();
    console.log('Sarvam TTS status:', response.status, 'body:', raw.slice(0, 500));

    let data;
    try { data = JSON.parse(raw); }
    catch (e) {
      data = { error: { message: raw || 'Non-JSON response from Sarvam' } };
    }

    if (!response.ok) {
      const providerError = data.error || { message: 'Sarvam TTS request failed' };
      return res.status(response.status).json({
        error: providerError,
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    const audio = data.audios && data.audios[0];
    if (!audio) {
      return res.status(502).json({
        error: { message: 'Sarvam returned success but no audio was returned' },
        provider_status: response.status,
        request_id: data.request_id || null
      });
    }

    return res.status(200).json({
      audio,
      request_id: data.request_id || null
    });
  } catch (err) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: err.message || 'TTS proxy error' });
  }
}
