import crypto from 'crypto';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const BRANCH = 'main';

function randomId(len = 6) {
  return crypto.randomBytes(4).toString('hex').slice(0, len);
}

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function push(path, content) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vercel'
    },
    body: JSON.stringify({
      message: `create ${path}`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH
    })
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text);
  }
  return JSON.parse(text);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!TOKEN || !REPO) {
      return res.status(500).json({ error: 'ENV NOT SET' });
    }

    const { title, content, desc, password } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Judul & isi wajib' });
    }

    const id = randomId();

    const meta = {
      title,
      desc: desc || '',
      password: password ? sha(password) : null,
      author: 'milodeveloper',
      created: new Date().toISOString()
    };

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
<p>${desc || ''}</p>
<pre>${content.replace(/</g,'&lt;')}</pre>
<hr><small>By milodeveloper</small>
</body>
</html>`;

    await push(`pastes/${id}/index.html`, html);
    await push(`pastes/${id}/raw.txt`, content);
    await push(`pastes/${id}/meta.json`, JSON.stringify(meta, null, 2));

    res.json({
      success: true,
      url: `/p/${id}`,
      raw: `/raw/${id}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
