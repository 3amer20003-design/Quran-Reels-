import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/pexels/search', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      // Fallback sample videos if no key
      return res.json({
        videos: [
          { video_files: [{ link: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', width: 1280, height: 720 }] },
          { video_files: [{ link: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', width: 1280, height: 720 }] }
        ]
      });
    }

    const pexelsRes = await fetch(`https://api.pexels.com/videos/search?query=${query}&orientation=portrait&size=medium&per_page=5`, {
      headers: {
        Authorization: apiKey
      }
    });
    
    if (!pexelsRes.ok) {
       throw new Error('Pexels API error');
    }
    const data = await pexelsRes.json();
    res.json(data);
  } catch (error) {
    console.error('Pexels Error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Proxy for Quran.com audio to bypass CORS when drawing to Canvas
app.get('/api/proxy/audio', async (req, res) => {
    try {
        const url = req.query.url as string;
        if (!url) return res.status(400).send('URL required');
        const fetchRes = await fetch(url);
        
        res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const buffer = await fetchRes.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        console.error('Audio proxy error:', e);
        res.status(500).send('Proxy error');
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
