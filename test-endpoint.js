import http from 'http';
import handler from './api/triage-report.js';

// Create a simple test server
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/triage-report' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const mockReq = {
          method: 'POST',
          body: JSON.parse(body)
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data, null, 2));
            }
          }),
          json: (data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data, null, 2));
          }
        };
        
        await handler(mockReq, mockRes);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

// Test the endpoint
function testEndpoint() {
  const testData = JSON.stringify({
    domain: "e-commerce",
    persona: "frustrated customer",
    inquiry: "I ordered a product 2 weeks ago and it still hasn't arrived. The tracking shows it's been stuck at the same location for 5 days. I need this for an important event tomorrow. This is completely unacceptable!",
    userId: "user123"
  });

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/triage-report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  console.log('\nTesting triage-report endpoint...');
  console.log('Request data:', JSON.parse(testData));

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse status:', res.statusCode);
      console.log('Response data:', data);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('Error testing endpoint:', error);
    process.exit(1);
  });

  req.write(testData);
  req.end();
}

// Run test after a short delay
setTimeout(testEndpoint, 1000);