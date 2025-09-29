#!/usr/bin/env node
/**
 * Manual testing script for security features
 * Run with: node test-security.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSecurityHeaders() {
  console.log('🔒 Testing Security Headers...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    
    console.log('✅ Response Status:', response.statusCode);
    console.log('🛡️  Security Headers:');
    console.log('   - Content-Security-Policy:', response.headers['content-security-policy'] ? '✅' : '❌');
    console.log('   - X-Content-Type-Options:', response.headers['x-content-type-options'] || 'Missing');
    console.log('   - X-Frame-Options:', response.headers['x-frame-options'] || 'Missing');
    console.log('   - X-XSS-Protection:', response.headers['x-xss-protection'] || 'Missing');
    console.log('   - Referrer-Policy:', response.headers['referrer-policy'] || 'Missing');
    console.log('');
  } catch (error) {
    console.log('❌ Error testing security headers:', error.message);
  }
}

async function testRateLimit() {
  console.log('⚡ Testing Rate Limiting...');
  
  const requests = [];
  const ip = '192.168.1.100';
  
  // Make 7 rapid requests
  for (let i = 0; i < 7; i++) {
    requests.push(
      makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        headers: {
          'X-Forwarded-For': ip
        }
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const successful = responses.filter(r => r.statusCode === 200).length;
    const rateLimited = responses.filter(r => r.statusCode === 429).length;
    
    console.log(`✅ Successful requests: ${successful}/7`);
    console.log(`🚫 Rate limited requests: ${rateLimited}/7`);
    
    if (rateLimited > 0) {
      console.log('✅ Rate limiting is working correctly!');
    } else {
      console.log('⚠️  Rate limiting may not be working as expected');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Error testing rate limit:', error.message);
  }
}

async function testBodySizeLimit() {
  console.log('📏 Testing Body Size Limit...');
  
  // Test with small payload (should succeed)
  try {
    const smallResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/triage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.101'
      }
    }, {
      ticketContent: 'Small test content',
      priority: 'medium'
    });
    
    console.log('✅ Small payload (< 32KB):', smallResponse.statusCode === 200 ? 'Accepted' : 'Rejected');
  } catch (error) {
    console.log('❌ Error with small payload:', error.message);
  }
  
  // Test with large payload (should fail)
  try {
    const largeContent = 'x'.repeat(33 * 1024); // 33 KB
    const largeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/triage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify({ticketContent: largeContent})),
        'X-Forwarded-For': '192.168.1.102'
      }
    }, {
      ticketContent: largeContent,
      priority: 'high'
    });
    
    console.log('🚫 Large payload (> 32KB):', largeResponse.statusCode === 413 ? 'Rejected ✅' : `Unexpected: ${largeResponse.statusCode}`);
  } catch (error) {
    console.log('❌ Error with large payload:', error.message);
  }
  
  console.log('');
}

async function runTests() {
  console.log('🧪 INT Smart Triage AI 2.0 - Security Test Suite');
  console.log('================================================\n');
  
  console.log('⚠️  Make sure your server is running on localhost:3000');
  console.log('   Start with: npm run dev\n');
  
  await testSecurityHeaders();
  await testRateLimit();
  await testBodySizeLimit();
  
  console.log('🎉 Security testing complete!');
  console.log('   Review the results above to verify all security features are working.');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSecurityHeaders, testRateLimit, testBodySizeLimit };