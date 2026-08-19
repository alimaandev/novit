const REPO = 'alimaandev/novit'
const BRANCH = 'download-counter'
const FILE = 'downloads.json'
const ASSET = 'https://github.com/alimaandev/novit/releases/download/v1.0.0/novit-1.0.0-setup.exe'

const HEADERS = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
  'User-Agent': 'novit-landing',
  Accept: 'application/vnd.github+json'
}

async function getCount() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: HEADERS })
  if (!res.ok) return { count: 0, sha: null }
  const file = await res.json()
  let count = 0
  try {
    count = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')).count || 0
  } catch {
    count = 0
  }
  return { count, sha: file.sha }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).end()
    return
  }
  try {
    const { count, sha } = await getCount()
    const body = {
      message: 'increment download count',
      content: Buffer.from(JSON.stringify({ count: count + 1 })).toString('base64'),
      branch: BRANCH
    }
    if (sha) body.sha = sha
    await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      method: 'PUT',
      headers: { ...HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch {
    // fail open: never block the download
  }
  res.setHeader('Location', ASSET)
  res.status(302).end()
}