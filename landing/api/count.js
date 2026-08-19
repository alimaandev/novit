const REPO = 'alimaandev/novit'
const BRANCH = 'download-counter'
const FILE = 'downloads.json'

const HEADERS = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
  'User-Agent': 'novit-landing',
  Accept: 'application/vnd.github+json'
}

export default async function handler(req, res) {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: HEADERS })
    if (!r.ok) throw new Error(`github ${r.status}`)
    const file = await r.json()
    const count = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')).count || 0
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(JSON.stringify({ count }))
  } catch {
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(JSON.stringify({ count: null }))
  }
}