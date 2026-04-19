// Vercel Serverless Function — proxies YouTube Data API v3 so the API key
// stays server-side and never reaches the browser.
//
// GET /api/youtube-stats?videoId=dQw4w9WgXcQ
// Returns: { views, likes, comments }
//
// Setup: add YOUTUBE_API_KEY to your Vercel project environment variables.
// Get a key from https://console.cloud.google.com → YouTube Data API v3.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.query;
  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'videoId query param required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured on the server' });
  }

  const cleanId = videoId.trim();
  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=statistics&id=${encodeURIComponent(cleanId)}&key=${apiKey}`;

  let data;
  try {
    const resp = await fetch(url);
    data = await resp.json();
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach YouTube API', detail: err.message });
  }

  if (data.error) {
    return res.status(400).json({ error: data.error.message ?? 'YouTube API error' });
  }

  if (!data.items || data.items.length === 0) {
    return res.status(404).json({ error: 'Video not found. Check the video ID.' });
  }

  const s = data.items[0].statistics;
  return res.status(200).json({
    views:    parseInt(s.viewCount    ?? '0', 10),
    likes:    parseInt(s.likeCount    ?? '0', 10),
    comments: parseInt(s.commentCount ?? '0', 10),
  });
}
