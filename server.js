const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Website status check endpoint
app.get('/check', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }
  
  console.log(`Checking status for: ${url}`);
  
  try {
    // Attempt to fetch the website
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // If we get here, the website is up
    console.log(`Status for ${url}: Up (${response.status})`);
    res.send('Up');
  } catch (error) {
    // If there's an error, the website is down
    console.log(`Status for ${url}: Down (${error.message || 'Unknown error'})`);
    res.send('Down');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Website status check endpoint: http://localhost:${port}/check?url=https://example.com`);
});