import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { Mistral } from '@mistralai/mistralai';

const app = express();
const port = process.env.PORT || 3000;

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const RAPIDAPI_HOST = 'youtube-transcriptor.p.rapidapi.com';

const SYSTEM_PROMPT = `You are an expert crochet pattern writer.

Your job is to convert a raw video transcript from a crochet tutorial into a clean, structured written pattern.

RULES:

Before extracting the pattern, ignore:

- Personal anecdotes and stories
- Market/selling talk
- Sponsor mentions
- Any sentence that doesn't contain a crochet instruction

- Use standard crochet abbreviations (sc, dc, hdc, sl st, ch, inc, dec, st, sts, rnd, row, rep, ...)
- Structure the pattern with clear steps: Round/Row number, instructions, stitch count at the end in parentheses
- If the tutorial is worked in rounds, use "Rnd". If in rows, use "Row"
- Keep the language concise and technical, like a published pattern
- If the creator mentions yarn weight, hook size, or materials, include them at the top in a "Materials" section
- If stitch counts are not explicitly mentioned, try to infer them from context
- Do not include commentary, jokes, or filler from the transcript — pattern instructions only
- If a section is unclear or missing from the transcript, write [unclear] rather than guessing

OUTPUT FORMAT:

Materials: (if mentioned)

Abbreviations: (list only the ones used)

Pattern:

Rnd 1: ...  (X sts)

Rnd 2: ...  (X sts)

...`;

app.get('/api/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const lang = req.query.lang || 'en';

    const rapidRes = await axios.get(`https://${RAPIDAPI_HOST}/transcript`, {
      params: { video_id: videoId, lang },
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
    });

    const videoData = rapidRes.data[0];
    const transcriptText = videoData.transcription
      .map(t => t.subtitle)
      .join(' ');

    const mistralRes = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `TRANSCRIPT:\n${transcriptText}` },
      ],
    });

    const pattern = mistralRes.choices[0].message.content;

    res.json({
      title: videoData.title,
      description: videoData.description,
      availableLangs: videoData.availableLangs,
      lengthInSeconds: videoData.lengthInSeconds,
      thumbnails: videoData.thumbnails,
      pattern,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`hookara server listening on port ${port}`);
});
