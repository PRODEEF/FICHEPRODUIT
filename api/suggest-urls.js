/**
 * Suggest ecommerce site URLs from a free-text hint (store name, etc.).
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise returns heuristic candidates.
 * GET or POST: ?q=... or body { q: "..." }
 */

function heuristicUrls(q) {
  const s = String(q).toLowerCase().trim()
  const slug = s
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .replace(/^-+|-+$/g, '')
  if (!slug) return []
  const out = []
  const add = (u) => {
    if (!out.includes(u)) out.push(u)
  }
  add(`https://www.${slug}.fr`)
  add(`https://${slug}.fr`)
  add(`https://www.${slug}.com`)
  add(`https://${slug}.com`)
  return out
}

function normalizeUrlList(urls) {
  if (!Array.isArray(urls)) return []
  const seen = new Set()
  const out = []
  for (const item of urls) {
    const u = String(item || '').trim()
    if (!/^https?:\/\//i.test(u)) continue
    try {
      const parsed = new URL(u)
      const href = parsed.href.replace(/\/+$/, '') || parsed.origin
      if (!seen.has(href)) {
        seen.add(href)
        out.push(href)
      }
    } catch (_) {
      /* skip */
    }
  }
  return out.slice(0, 8)
}

async function suggestWithOpenAI(q) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You resolve store names or short French descriptions to likely official ecommerce homepages. ' +
            'Reply with JSON only: {"urls":["https://..."]} — 3 to 6 URLs, best guess first. ' +
            'Use https. No markdown, no extra keys.',
        },
        { role: 'user', content: String(q).trim() },
      ],
    }),
  })

  if (!res.ok) return null
  const data = await res.json().catch(() => ({}))
  const text = data.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string') return null
  try {
    const parsed = JSON.parse(text)
    const list = normalizeUrlList(parsed.urls)
    return list.length ? list : null
  } catch (_) {
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = (req.query?.q || req.body?.q || '').trim()
  if (!q) return res.status(400).json({ error: 'Paramètre q manquant' })

  let urls = await suggestWithOpenAI(q).catch(() => null)
  if (!urls || urls.length === 0) {
    urls = heuristicUrls(q)
  }

  return res.status(200).json({ urls })
}
