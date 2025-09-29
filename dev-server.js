/**
 * Simple development server for testing the refactored demo
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = createServer((req, res) => {
  let filePath;
  
  if (req.url === '/') {
    filePath = join(__dirname, 'public', 'demo.html');
  } else if (req.url.startsWith('/data/')) {
    filePath = join(__dirname, req.url.slice(1));
  } else if (req.url.startsWith('/js/')) {
    filePath = join(__dirname, 'public', req.url.slice(1));
  } else if (req.url.startsWith('/css/')) {
    filePath = join(__dirname, 'public', req.url.slice(1));
  } else if (req.url.startsWith('/src/')) {
    filePath = join(__dirname, req.url.slice(1));
  } else if (req.url.startsWith('/config/')) {
    filePath = join(__dirname, req.url.slice(1));
  } else {
    filePath = join(__dirname, 'public', req.url);
  }

  // Check if file exists
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`File not found: ${req.url}`);
    return;
  }

  try {
    const content = readFileSync(filePath);
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    const contentType = MIME_TYPES[ext] || 'text/plain';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
});