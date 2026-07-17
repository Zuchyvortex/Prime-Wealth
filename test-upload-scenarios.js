// test-upload-scenarios.js
// Tests various upload scenarios against the /api/upload endpoint.
// Validates file types (JPG, PNG, PDF), large file rejection (>10MB), and invalid file rejection.
// Ensures every scenario returns valid JSON responses with the correct status codes.

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting Upload Scenarios Test Suite...');
  
  // 1. Register a new user to make sure the credentials are valid
  const uniqueEmail = `upload_tester_${Date.now()}@example.com`;
  console.log(`\n--- 1. Registering Unique Test User: ${uniqueEmail} ---`);
  
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Upload Tester',
        email: uniqueEmail,
        password: 'password123',
        phone: '+15559998888'
      })
    });
    
    if (!regRes.ok) {
      const regErr = await regRes.text();
      throw new Error(`Registration failed with status ${regRes.status}: ${regErr}`);
    }
    console.log('✅ Registration completed.');
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    process.exit(1);
  }

  // 2. Log in the test user to get a session cookie
  console.log('\n--- 2. Authenticating Test User ---');
  let cookieHeader = '';
  try {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookieHeader = csrfRes.headers.get('set-cookie');
    
    if (!csrfToken || !csrfCookieHeader) {
      throw new Error('Failed to retrieve CSRF token or cookie');
    }
    
    const csrfCookie = csrfCookieHeader.split(';')[0];
    
    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie,
      },
      body: new URLSearchParams({
        email: uniqueEmail,
        password: 'password123',
        csrfToken: csrfToken,
        json: 'true',
      }),
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    
    const loginCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : (loginRes.headers.get('set-cookie') ? [loginRes.headers.get('set-cookie')] : []);
    
    for (const cookie of loginCookies) {
      if (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')) {
        cookieHeader = cookie.split(';')[0];
        break;
      }
    }
    
    if (!cookieHeader) {
      throw new Error('Failed to get session cookie from login response');
    }
    
    console.log('✅ User authenticated successfully.');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  // Helper to submit a request with FormData
  async function testUpload(fileName, fileBuffer, fileType) {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: fileType });
    formData.append('file', blob, fileName);

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
      },
      body: formData,
    });

    const responseText = await res.text();
    let responseJson = null;
    let isJson = false;
    try {
      responseJson = JSON.parse(responseText);
      isJson = true;
    } catch (e) {
      // Not JSON
    }

    return {
      status: res.status,
      isJson,
      json: responseJson,
      text: responseText
    };
  }

  // 3. Test JPG Upload
  console.log('\n--- 3. Testing JPG Upload ---');
  const jpgBuffer = Buffer.alloc(100 * 1024); // 100 KB
  const jpgRes = await testUpload('test_id.jpg', jpgBuffer, 'image/jpeg');
  console.log(`Status: ${jpgRes.status}, Is JSON: ${jpgRes.isJson}`);
  console.log('Response:', jpgRes.json || jpgRes.text);
  if (jpgRes.status === 200 && jpgRes.json?.success === true && jpgRes.json?.url) {
    console.log('✅ JPG Upload Passed!');
  } else {
    console.error('❌ JPG Upload Failed!');
    process.exit(1);
  }

  // 4. Test PNG Upload
  console.log('\n--- 4. Testing PNG Upload ---');
  const pngBuffer = Buffer.alloc(150 * 1024); // 150 KB
  const pngRes = await testUpload('test_id.png', pngBuffer, 'image/png');
  console.log(`Status: ${pngRes.status}, Is JSON: ${pngRes.isJson}`);
  console.log('Response:', pngRes.json || pngRes.text);
  if (pngRes.status === 200 && pngRes.json?.success === true && pngRes.json?.url) {
    console.log('✅ PNG Upload Passed!');
  } else {
    console.error('❌ PNG Upload Failed!');
    process.exit(1);
  }

  // 5. Test PDF Upload
  console.log('\n--- 5. Testing PDF Upload ---');
  const pdfBuffer = Buffer.alloc(200 * 1024); // 200 KB
  const pdfRes = await testUpload('test_doc.pdf', pdfBuffer, 'application/pdf');
  console.log(`Status: ${pdfRes.status}, Is JSON: ${pdfRes.isJson}`);
  console.log('Response:', pdfRes.json || pdfRes.text);
  if (pdfRes.status === 200 && pdfRes.json?.success === true && pdfRes.json?.url) {
    console.log('✅ PDF Upload Passed!');
  } else {
    console.error('❌ PDF Upload Failed!');
    process.exit(1);
  }

  // 6. Test Large File Rejection (>10MB)
  console.log('\n--- 6. Testing Large File (>10MB) Rejection ---');
  const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
  const largeRes = await testUpload('huge_id.png', largeBuffer, 'image/png');
  console.log(`Status: ${largeRes.status}, Is JSON: ${largeRes.isJson}`);
  console.log('Response:', largeRes.json || largeRes.text);
  if (largeRes.status === 413 && largeRes.json?.success === false && largeRes.json?.message) {
    console.log('✅ Large File Rejection Passed!');
  } else {
    console.error('❌ Large File Rejection Failed!');
    process.exit(1);
  }

  // 7. Test Invalid File Type Rejection
  console.log('\n--- 7. Testing Invalid File Type Rejection ---');
  const invalidBuffer = Buffer.alloc(10 * 1024); // 10 KB
  const invalidRes = await testUpload('malicious_script.sh', invalidBuffer, 'text/x-shellscript');
  console.log(`Status: ${invalidRes.status}, Is JSON: ${invalidRes.isJson}`);
  console.log('Response:', invalidRes.json || invalidRes.text);
  if (invalidRes.status === 400 && invalidRes.json?.success === false && invalidRes.json?.message) {
    console.log('✅ Invalid File Type Rejection Passed!');
  } else {
    console.error('❌ Invalid File Type Rejection Failed!');
    process.exit(1);
  }

  console.log('\n🎉 ALL UPLOAD SCENARIOS PASSED SUCCESSFULLY!');
}

main();
