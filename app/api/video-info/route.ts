export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return Response.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const videoId = extractVideoId(url)
  if (!videoId) {
    return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }

  const oembedRes = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  )

  if (!oembedRes.ok) {
    return Response.json({ error: 'Could not fetch video info' }, { status: 500 })
  }

  const oembed = await oembedRes.json()

  let channelAvatar = ''
  if (oembed.author_url) {
    try {
      const channelRes = await fetch(oembed.author_url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const channelHtml = await channelRes.text()
      const match = channelHtml.match(
        /<meta\s+property="og:image"\s+content="([^"]+)"/
      )
      if (match) channelAvatar = match[1]
    } catch {}
  }

  let description = ''
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const html = await pageRes.text()
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/)
    if (descMatch) description = descMatch[1]
  } catch {}

  return Response.json({
    title: oembed.title ?? '',
    channelName: oembed.author_name ?? '',
    channelAvatar,
    thumbnailUrl: oembed.thumbnail_url ?? '',
    description,
    videoId,
  })
}
function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}
