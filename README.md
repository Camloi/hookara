# Hookara

Turn a YouTube crochet tutorial into a clean, structured written pattern.

Paste a video URL, and Hookara fetches the transcript, checks that it's actually a crochet tutorial, and uses AI to generate a step-by-step pattern (materials, abbreviations, rounds/rows, stitch counts, assembly) in French or American terminology.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example` and fill in your API keys:

```bash
cp .env.example .env
```

- `MISTRAL_API_KEY` — from [Mistral AI](https://mistral.ai) (used to generate the pattern from the transcript)
- `RAPIDAPI_KEY` — a [RapidAPI](https://rapidapi.com) key subscribed to a YouTube transcript API

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Mistral AI](https://mistral.ai) for transcript-to-pattern generation
- Tailwind CSS + Radix UI

## License

MIT — see [LICENSE](./LICENSE).
