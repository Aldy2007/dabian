export default async function handler(req, res) {
  const KV_URL = 'https://api.vercel.aldyh.top/kv/dabian-comments?password=Aldy2007';

  if (req.method === 'GET') {
    try {
      const response = await fetch(KV_URL);
      if (response.status === 404) {
        return res.status(200).json({});
      }
      const data = await response.json();
      let comments = {};
      if (data && data.value) {
        try {
          comments = JSON.parse(data.value);
        } catch (e) {
           comments = {};
        }
      }
      return res.status(200).json(comments);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { articleId, author, content } = req.body;
      if (!articleId || !content) {
        return res.status(400).json({ error: 'Missing articleId or content' });
      }

      // Fetch existing
      const response = await fetch(KV_URL);
      let data = null;
      if (response.status !== 404) {
        data = await response.json();
      }
      
      let comments = {};
      if (data && data.value) {
        try {
          comments = JSON.parse(data.value);
        } catch (e) {
          comments = {};
        }
      }

      // Add new comment
      const newComment = {
        id: Date.now().toString(),
        author: author || 'Anonymous',
        content,
        date: new Date().toISOString()
      };

      if (!comments[articleId]) {
        comments[articleId] = [];
      }
      comments[articleId].push(newComment);

      // Save back
      const putResponse = await fetch(KV_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(comments) })
      });

      if (!putResponse.ok) {
        const errText = await putResponse.text();
        console.error('KV PUT Error details:', putResponse.status, errText);
        throw new Error('Failed to save to KV');
      }

      return res.status(200).json({ success: true, newComment, comments });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to post comment' });
    }
  }

  res.status(405).end();
}
