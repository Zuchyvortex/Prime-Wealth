// Automated KYC Flow Verification Test
// Run with: node test-kyc.js

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting KYC Integration automated tests against:', baseUrl);

  // Helper function to perform credentials login via NextAuth API
  async function performLogin(email, password) {
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookieHeader = csrfRes.headers.get('set-cookie');
    
    if (!csrfToken || !csrfCookieHeader) {
      throw new Error('Failed to retrieve CSRF token or cookie');
    }

    const csrfCookie = csrfCookieHeader.split(';')[0];

    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);
    params.append('csrfToken', csrfToken);
    params.append('json', 'true');

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie
      },
      body: params.toString()
    });

    const loginData = await loginRes.json();
    const loginCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : (loginRes.headers.get('set-cookie') ? [loginRes.headers.get('set-cookie')] : []);
    
    let sessionCookie = '';
    for (const cookie of loginCookies) {
      if (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')) {
        sessionCookie = cookie.split(';')[0];
        break;
      }
    }

    return { status: loginRes.status, data: loginData, sessionCookie };
  }

  // 1. REGISTER NEW USER
  console.log('\n--- 1. Testing User Registration ---');
  const uniqueEmail = `kyc_user_${Date.now()}@example.com`;
  const registerPayload = {
    name: 'KYC Test User',
    email: uniqueEmail,
    password: 'password123',
    phone: '+15550001111'
  };

  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload)
  });

  const registerData = await registerRes.json();
  console.log('Registration Response Status:', registerRes.status);
  if (registerRes.status === 201 && registerData.success) {
    console.log('✅ User registered successfully!');
  } else {
    console.error('❌ User registration failed:', registerData);
    process.exit(1);
  }

  // 2. LOGIN USER & VERIFY UNVERIFIED STATUS
  console.log('\n--- 2. Testing User Login & Default Status ---');
  const userLogin = await performLogin(uniqueEmail, 'password123');
  if (!userLogin.sessionCookie) {
    console.error('❌ User login failed!');
    process.exit(1);
  }
  console.log('✅ User logged in successfully!');

  const profileRes = await fetch(`${baseUrl}/api/user/profile`, {
    headers: { 'Cookie': userLogin.sessionCookie }
  });
  const profileData = await profileRes.json();
  console.log('User status is:', profileData.status);
  if (profileData.status === 'UNVERIFIED') {
    console.log('✅ Success: New user status defaults to UNVERIFIED!');
  } else {
    console.error('❌ Error: User status did not default to UNVERIFIED. Got:', profileData.status);
    process.exit(1);
  }

  // 3. UPLOAD KYC DOCUMENT FILE
  console.log('\n--- 3. Testing Document Upload (/api/upload) ---');
  // Send dummy base64 representation of a PDF or image
  const uploadPayload = {
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    fileName: 'id_front.png',
    fileType: 'image/png'
  };

  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': userLogin.sessionCookie
    },
    body: JSON.stringify(uploadPayload)
  });

  const uploadData = await uploadRes.json();
  console.log('Upload Response Status:', uploadRes.status);
  console.log('Uploaded File URL:', uploadData.url);
  if (uploadRes.status === 200 && uploadData.url) {
    console.log('✅ Success: File upload completed!');
  } else {
    console.error('❌ Error: Upload API failed:', uploadData);
    process.exit(1);
  }

  // 4. SUBMIT KYC DATA
  console.log('\n--- 4. Testing KYC Submission ---');
  const kycPayload = {
    fullName: 'KYC Test User',
    dateOfBirth: '1990-05-15',
    nationality: 'German',
    country: 'Germany',
    address: '456 Compliance Ave, Berlin',
    phoneNumber: '+49 170 1234567',
    occupation: 'Security Specialist',
    idType: 'National ID Card',
    idNumber: 'ID987654321',
    expiryDate: '2030-01-01',
    idFrontUrl: uploadData.url,
    idBackUrl: uploadData.url,
    selfieUrl: uploadData.url
  };

  const kycRes = await fetch(`${baseUrl}/api/user/verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': userLogin.sessionCookie
    },
    body: JSON.stringify(kycPayload)
  });

  const kycData = await kycRes.json();
  console.log('KYC Submission Response Status:', kycRes.status);
  if (kycRes.status === 200 && kycData.success) {
    console.log('✅ Success: KYC data submitted!');
  } else {
    console.error('❌ Error: KYC submission failed:', kycData);
    process.exit(1);
  }

  // 5. ADMIN LOGIN
  console.log('\n--- 5. Testing Admin Login ---');
  const adminEmail = 'admin@primewealth.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'super_secure_admin_password';
  const adminLogin = await performLogin(adminEmail, adminPassword);
  if (!adminLogin.sessionCookie) {
    console.error('❌ Admin login failed!');
    process.exit(1);
  }
  console.log('✅ Admin logged in successfully!');

  // 6. ADMIN GET VERIFICATIONS QUEUE
  console.log('\n--- 6. Testing Admin Retrieval ---');
  const adminQueueRes = await fetch(`${baseUrl}/api/admin/verifications`, {
    headers: { 'Cookie': adminLogin.sessionCookie }
  });
  const adminQueue = await adminQueueRes.json();
  console.log('Number of verifications in queue:', adminQueue.length);
  
  const mySubmission = adminQueue.find(v => v.userId === profileData.id);
  if (mySubmission) {
    console.log('✅ Success: Submitted KYC found in Admin verification queue!');
  } else {
    console.error('❌ Error: Submitted KYC not found in Admin verification queue!');
    process.exit(1);
  }

  // 7. ADMIN PROCESS KYC DECISION (APPROVE)
  console.log('\n--- 7. Testing Admin Approval Decision ---');
  const approveRes = await fetch(`${baseUrl}/api/admin/verifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminLogin.sessionCookie
    },
    body: JSON.stringify({
      verificationId: mySubmission.id,
      action: 'approve'
    })
  });

  const approveData = await approveRes.json();
  console.log('Admin Approval Response Status:', approveRes.status);
  if (approveRes.status === 200 && approveData.success) {
    console.log('✅ Success: Verification approved by Admin!');
  } else {
    console.error('❌ Error: Admin approval API failed:', approveData);
    process.exit(1);
  }

  // 8. VERIFY UPDATED USER STATUS IN PROFILE
  console.log('\n--- 8. Verifying Updated User Status ---');
  const updatedProfileRes = await fetch(`${baseUrl}/api/user/profile`, {
    headers: { 'Cookie': userLogin.sessionCookie }
  });
  const updatedProfile = await updatedProfileRes.json();
  console.log('User status after approval is:', updatedProfile.status);
  if (updatedProfile.status === 'VERIFIED') {
    console.log('✅ Success: User status changed to VERIFIED!');
  } else {
    console.error('❌ Error: User status is not VERIFIED. Got:', updatedProfile.status);
    process.exit(1);
  }

  console.log('\n🎉 ALL KYC INTEGRATION END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('❌ Test runner encountered error:', err);
  process.exit(1);
});
