import crypto from 'crypto';
import fetch from 'node-fetch';

const TOKEN = "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";
const REPO = "gattrealdev/Gattbin"; // username/repo
const BRANCH = 'main';

function randomId(len = 6) {
  return crypto.randomBytes(4).toString('hex').slice(0, len);
}

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function push(path, content) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `create ${path}`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH
    })
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
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
<head>
<meta charset="utf-8">
<title>${title}</title>
</head>
<body>
<h1>${title}</h1>
<p>${desc || ''}</p>
<pre>${content.replace(/</g,'&lt;')}</pre>
<hr>
<small>By milodeveloper</small>
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
}
