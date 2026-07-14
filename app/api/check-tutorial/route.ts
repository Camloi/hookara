import { Mistral } from '@mistralai/mistralai'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')

  if (!title) {
    return Response.json({ error: 'Missing title parameter' }, { status: 400 })
  }

  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY, timeoutMs: 30000 })

  const prompt = `Analyze this YouTube video title and determine if it is a crochet tutorial (a video that teaches how to make something with crochet/hook and yarn).

Title: "${title}"

Rules:
- A crochet tutorial teaches how to make a specific item (amigurumi, blanket, garment, accessory, etc.)
- Videos about crochet haul, unboxing, review, or vlog are NOT tutorials
- Videos about knitting, sewing, or other crafts are NOT crochet tutorials
- If the title clearly mentions crochet stitches, rounds, or a specific crochet project, it IS a tutorial
- If you are unsure, err on the side of it being a tutorial (to avoid false negatives)

Return ONLY a valid JSON object with this exact structure:
{"isTutorial": true or false}

No markdown, no code fences, no explanation.`

  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  const rawContent = (() => {
    const c = response.choices?.[0]?.message?.content
    if (typeof c === 'string') return c
    if (Array.isArray(c)) return c.map((chunk) => ('text' in chunk ? chunk.text : '')).join('')
    return ''
  })()

  let cleaned = rawContent.trim()
  const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim()
  }

  try {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1)
    }
    const result = JSON.parse(cleaned)
    return Response.json({ isTutorial: Boolean(result.isTutorial) })
  } catch {
    return Response.json({ isTutorial: true })
  }
}
