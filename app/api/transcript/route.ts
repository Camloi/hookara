import { Mistral } from '@mistralai/mistralai'

export const maxDuration = 120

const RAPIDAPI_HOST = 'youtube-transcript3.p.rapidapi.com'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const lang = searchParams.get('lang') || 'en'
  const terminology = searchParams.get('terminology') || 'fr'

  if (!videoId) {
    return Response.json({ error: 'Missing videoId parameter' }, { status: 400 })
  }

  const url = `https://${RAPIDAPI_HOST}/api/transcript?videoId=${videoId}&lang=${lang}`
  const transcriptRes = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
    },
  })

  if (!transcriptRes.ok) {
    const err = await transcriptRes.text()
    return Response.json({ error: `Transcript API error: ${err}` }, { status: transcriptRes.status })
  }

  const transcriptData = await transcriptRes.json()
  type TranscriptSegment = { text: string; start: number; duration: number }

  function extractSegments(data: unknown): TranscriptSegment[] {
    const raw: TranscriptSegment[] = []

    function pushFromArr(arr: unknown[]) {
      for (const e of arr) {
        if (e && typeof e === 'object') {
          const obj = e as Record<string, unknown>
          const text = (obj.text || obj.subtitle || obj.content) as string
          if (!text) continue
          const start = Number(obj.start || obj.startTime || obj.offset || 0)
          const duration = Number(obj.duration || (Number(obj.end) - Number(obj.start || obj.startTime || obj.offset || 0)) || 3)
          raw.push({ text, start, duration })
        }
      }
    }

    if (Array.isArray(data)) {
      pushFromArr(data)
      return raw
    }

    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      for (const key of ['transcript', 'transcription', 'captions', 'segments']) {
        const val = obj[key]
        if (Array.isArray(val)) {
          pushFromArr(val)
          if (raw.length > 0) return raw
        }
        if (val && typeof val === 'object') {
          const inner = val as Record<string, unknown>
          for (const innerKey of ['segments', 'transcript', 'captions']) {
            if (Array.isArray(inner[innerKey])) {
              pushFromArr(inner[innerKey] as unknown[])
              if (raw.length > 0) return raw
            }
          }
        }
      }
    }

    return raw
  }

  if (!transcriptData.success) {
    return Response.json(
      { error: transcriptData.error || 'Une erreur est survenue lors de la récupération du transcript.' },
      { status: 404 }
    )
  }

  const segments = extractSegments(transcriptData)

  if (segments.length === 0) {
    return Response.json(
      { error: 'Aucun sous-titre disponible pour cette vidéo dans cette langue.' },
      { status: 404 }
    )
  }

  console.log('=== EXTRACTED SEGMENTS ===')
  console.log(`Count: ${segments.length}`)
  console.log(segments.slice(0, 5))
  console.log('=== END EXTRACTED SEGMENTS ===')

  const transcriptText = segments.map((s) => s.text).join(' ')

  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY, timeoutMs: 120000 })

  const isFR = terminology === 'fr'

  const prompt = `You are an expert crochet pattern writer. Your task is to convert a raw video transcript from a crochet tutorial into a precise, structured JSON pattern, following these rules:

### TERMINOLOGY
Output the pattern using ${isFR ? 'FRENCH (FR)' : 'AMERICAN (US)'} crochet terminology.
${isFR ? "Use French abbreviations: ms = maille serrée, ml = maille en l'air, aug = augmentation, dim = diminution, BDD = brides dorsales, etc." : 'Use US abbreviations: sc = single crochet, ch = chain, inc = increase, dec = decrease, BLO = back loop only, etc.'}

### GENERAL RULES
1. Ignore all non-instruction content:
   - Personal anecdotes, sponsor mentions, selling talk, jokes, or filler sentences.
   - Only extract technical crochet instructions (stitches, rounds, counts, assembly).

2. Materials and Tools:
   - Extract yarn type/size, hook size, and accessories (e.g., fiberfill, safety eyes) if mentioned.
   - If not mentioned, write: "${isFR ? "Matériel : [non précisé dans le transcript]" : "Materials: [not specified in transcript]"}".
   - ${isFR ? "IMPORTANT: Output the entire materials field in FRENCH. Translate all terms: Yarn = Fil, Hook = Crochet, Accessories = Accessoires, scissors = ciseaux, yarn needle = aiguille à laine, cotton = coton, etc." : "Output in English."}

3. Abbreviations:
   - Use standard crochet abbreviations (${isFR ? 'ms, ml, aug, dim, BDD, etc.' : 'sc, ch, inc, dec, BLO, etc.'}).
   - If the transcript uses non-standard terms, convert them to standard abbreviations for the ${isFR ? 'French' : 'American'} convention.
   - ${isFR ? "IMPORTANT: Output abbreviations in FRENCH with French descriptions." : "Output in English."}

### STRUCTURE RULES
1. Group by Component:
   - Each physical part of the project (e.g., "Front Flippers", "Hind Legs", "Head", "Shell") must be a separate step in the steps array.
   - If the transcript says "make four flippers" but later specifies "Hind legs: Make 2", split into:
     - "Front Flippers (Make 2)"
     - "Hind Legs (Make 2)"

2. Rounds/Rows:
   - Each step has a "rounds" array. Each round is an object with:
     - "number": the round/row number (integer)
     - "instruction": the instruction text for that round
     - "stitches": the total stitch count at the end of that round (integer)
     - "timestamp": the start time in seconds (number) from the transcript where this specific round begins
   - If a round's stitch count is not explicitly stated, infer it from context or set to 0.
   - Use the earliest matching timestamp from the transcript segments for each individual round.

### LABEL RULES
- The "label" field for each step must be SHORT and CLEAN: just the component name (e.g., "Coaster", "Leaves", "Flowers", "Head", "Assembly").
- NEVER include round numbers, row counts, or "Make X" in the label. Put that info in the rounds if needed.
- Examples of GOOD labels: "Base", "Petal Ring", "Stem", "Assembly"
- Examples of BAD labels: "Base (Coaster)", "Leaves (Round 5)", "Flowers (Round 6)", "Head (Make 1)"

3. Inline Assembly Instructions:
   - If the transcript mentions assembling or attaching parts WITHIN a component (e.g., "fix the eyes on the head" or "sew the ears to the head"), include it as a round-like entry in that same component's rounds array.
   - Use "number": 0 for these inline assembly entries to distinguish them from numbered rounds.
   - Example: {"number": 0, "instruction": "Fix safety eyes between Rnd 5 and Rnd 6, 6 stitches apart", "stitches": 0}

4. Assembly Instructions:
   - If the transcript describes how to attach separate parts (e.g., sewing flippers to the shell), include it in a dedicated "Assembly" step.
   - Use clear, actionable language (e.g., "Attach front flippers to shell with 2 sc each").
   - Assembly steps have a "rounds" array with a single entry: {"number": 0, "instruction": "[assembly instruction]", "stitches": 0}

5. Uncertainty Handling:
   - If a stitch count or step is unclear, mark it as "[unclear]" and set "uncertain": true.
   - If a detail is only visual (not in the transcript), mark it as "[visual - check video]" and set "uncertain": true.

### TIMESTAMP RULES
- Each step MUST have a "timestamp" field with the start time in seconds (number) from the transcript where that step begins.
- Use the earliest matching timestamp from the transcript segments provided below.
- If no matching timestamp is found, use 0.

### OUTPUT FORMAT
Return ONLY a valid JSON object (no markdown, no code fences, no explanation), with this exact structure:
{
  "materials": "${isFR ? "Fil: [type/taille], Crochet: [taille], Accessoires: [liste]" : "Yarn: [type/size], Hook: [size], [accessories]"}",
  "abbreviations": "${isFR ? "ms = maille serrée, ml = maille en l'air, aug = augmentation (2 ms dans la même maille), dim = diminution (rabattre 2 mailles ensemble), BDD = brides dorsales, ..." : 'sc = single crochet, ch = chain, inc = increase (2 sc in 1 st), dec = decrease (sc2tog), BLO = back loop only, ...'}",
  "steps": [
    {
      "label": "[Component Name] (Make X)",
      "timestamp": 120,
      "uncertain": false,
      "rounds": [
        {"number": 1, "instruction": "6 sc in MR", "stitches": 6, "timestamp": 120},
        {"number": 2, "instruction": "inc around", "stitches": 12, "timestamp": 135},
        {"number": 3, "instruction": "[sc, inc] x 6", "stitches": 18, "timestamp": 150},
        {"number": 0, "instruction": "Fix safety eyes between this round", "stitches": 0, "timestamp": 165}
      ]
    },
    {
      "label": "Assembly",
      "timestamp": 0,
      "uncertain": false,
      "rounds": [
        {"number": 0, "instruction": "Attach front flippers to shell with 2 sc each", "stitches": 0}
      ]
    }
  ]
}

### TRANSCRIPT SEGMENTS (with timestamps):
${segments.map((s) => `[${Math.floor(s.start)}s] ${s.text}`).join('\n')}

### TRANSCRIPT (full text):
${transcriptText}`

  const response = await mistral.chat.complete({
    model: 'mistral-medium-3-5',
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

  console.log('=== RAW AI RESPONSE ===')
  console.log(rawContent)
  console.log('=== END RAW AI RESPONSE ===')

  let cleanedPattern = rawContent
  const jsonMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonMatch) {
    cleanedPattern = jsonMatch[1].trim()
  }

  // Try to extract JSON even without code fences (e.g. trailing text)
  try {
    JSON.parse(cleanedPattern)
  } catch {
    // Find the first { and last } to extract JSON object
    const firstBrace = cleanedPattern.indexOf('{')
    const lastBrace = cleanedPattern.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleanedPattern = cleanedPattern.slice(firstBrace, lastBrace + 1)
      console.log('=== EXTRACTED JSON (no code fences) ===')
      console.log(cleanedPattern)
      console.log('=== END EXTRACTED JSON ===')
    }
  }

  return Response.json({ pattern: cleanedPattern, transcript: segments })
}
