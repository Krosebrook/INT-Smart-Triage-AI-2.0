import http from 'http';
import handler from './api/triage-report.js';

// Test cases for validation
const testCases = [
  {
    name: 'Valid request',
    data: {
      domain: "e-commerce",
      persona: "frustrated customer",
      inquiry: "Product not delivered",
      userId: "user123"
    },
    expectedStatus: 200
  },
  {
    name: 'Missing domain',
    data: {
      persona: "frustrated customer",
      inquiry: "Product not delivered",
      userId: "user123"
    },
    expectedStatus: 400
  },
  {
    name: 'Missing persona',
    data: {
      domain: "e-commerce",
      inquiry: "Product not delivered",
      userId: "user123"
    },
    expectedStatus: 400
  },
  {
    name: 'Missing inquiry',
    data: {
      domain: "e-commerce",
      persona: "frustrated customer",
      userId: "user123"
    },
    expectedStatus: 400
  },
  {
    name: 'Missing userId',
    data: {
      domain: "e-commerce",
      persona: "frustrated customer",
      inquiry: "Product not delivered"
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid domain type',
    data: {
      domain: 123,
      persona: "frustrated customer",
      inquiry: "Product not delivered",
      userId: "user123"
    },
    expectedStatus: 400
  }
];

let currentTest = 0;

function runTest(testCase) {
  return new Promise((resolve) => {
    const mockReq = {
      method: 'POST',
      body: testCase.data
    };
    
    let responseStatus;
    let responseData;
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseStatus = code;
          responseData = data;
          resolve({ status: responseStatus, data: responseData });
        }
      }),
      json: (data) => {
        responseStatus = 200;
        responseData = data;
        resolve({ status: responseStatus, data: responseData });
      }
    };
    
    handler(mockReq, mockRes).catch((error) => {
      resolve({ status: 500, data: { error: error.message } });
    });
  });
}

async function runAllTests() {
  console.log('Running API validation tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    
    try {
      const result = await runTest(testCase);
      
      if (result.status === testCase.expectedStatus) {
        console.log(`✅ PASSED (${result.status})`);
        if (testCase.expectedStatus === 200) {
          console.log(`   Report generated: ${result.data.success ? 'Yes' : 'No'}`);
        } else {
          console.log(`   Error: ${result.data.error}`);
        }
        passed++;
      } else {
        console.log(`❌ FAILED - Expected ${testCase.expectedStatus}, got ${result.status}`);
        console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAILED - Exception: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  // Test GET method (should return 405)
  console.log('\nTesting GET method (should return 405)...');
  const getResult = await runTest({ data: {} });
  const mockGetReq = { method: 'GET', body: {} };
  const getResponse = await new Promise((resolve) => {
    const mockRes = {
      status: (code) => ({
        json: (data) => resolve({ status: code, data })
      })
    };
    handler(mockGetReq, mockRes);
  });
  
  if (getResponse.status === 405) {
    console.log('✅ GET method correctly rejected');
    passed++;
  } else {
    console.log(`❌ GET method test failed - Expected 405, got ${getResponse.status}`);
    failed++;
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

runAllTests();