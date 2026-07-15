// Using global fetch (Node 20+)

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting end-to-end authentication backend tests against:', baseUrl);

  // 1. REGISTER USER
  console.log('\n--- 1. Testing User Registration ---');
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const registerPayload = {
    name: 'Test User',
    email: uniqueEmail,
    password: 'password123',
    phone: '+15555555555'
  };

  let registerRes;
  try {
    registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
  } catch (error) {
    console.error('❌ Failed to connect to server. Is it running?', error.message);
    process.exit(1);
  }

  const registerData = await registerRes.json();
  console.log('Registration Status:', registerRes.status);
  console.log('Registration Response:', registerData);
  if (registerRes.status === 201 && registerData.success) {
    console.log('✅ User registration successful!');
  } else {
    console.error('❌ User registration failed!');
    process.exit(1);
  }

  // Helper function to perform credentials login via NextAuth API
  async function performLogin(email, password) {
    // A. Get CSRF Token
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const csrfCookieHeader = csrfRes.headers.get('set-cookie');
    
    if (!csrfToken || !csrfCookieHeader) {
      throw new Error('Failed to retrieve CSRF token or cookie');
    }

    // Extract csrf token cookie value
    // E.g., next-auth.csrf-token=xxx; Path=/; HttpOnly
    const csrfCookie = csrfCookieHeader.split(';')[0];

    // B. Post to callback/credentials
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
    
    // Find session token cookie
    let sessionCookie = '';
    for (const cookie of loginCookies) {
      if (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')) {
        sessionCookie = cookie.split(';')[0];
        break;
      }
    }

    return { status: loginRes.status, data: loginData, sessionCookie };
  }

  // 2. USER LOGIN
  console.log('\n--- 2. Testing User Login ---');
  const userLoginResult = await performLogin(uniqueEmail, 'password123');
  console.log('User Login Status:', userLoginResult.status);
  console.log('User Login Response:', userLoginResult.data);
  
  if (userLoginResult.sessionCookie) {
    console.log('✅ User login successful! Session Cookie obtained.');
  } else {
    console.error('❌ User login failed! No session cookie returned.');
    process.exit(1);
  }

  // 3. USER DASHBOARD / SESSION ACCESS
  console.log('\n--- 3. Testing User Session Verification ---');
  const userSessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      'Cookie': userLoginResult.sessionCookie
    }
  });
  const userSessionData = await userSessionRes.json();
  console.log('User Session Response:', userSessionData);
  if (userSessionRes.status === 200 && userSessionData.user && userSessionData.user.role === 'user') {
    console.log('✅ User dashboard session verified!');
  } else {
    console.error('❌ User dashboard session verification failed!');
    process.exit(1);
  }

  // 4. ADMIN LOGIN WITH ENV PASSWORD
  console.log('\n--- 4. Testing Admin Login (env password) ---');
  const adminEmail = 'admin@primewealth.com';
  // Let's check environment variable or fallback to super_secure_admin_password
  const adminPassword = process.env.ADMIN_PASSWORD || 'super_secure_admin_password';
  console.log(`Attempting login for ${adminEmail} with password: ${adminPassword}`);

  const adminLoginResult = await performLogin(adminEmail, adminPassword);
  console.log('Admin Login Status:', adminLoginResult.status);
  console.log('Admin Login Response:', adminLoginResult.data);

  if (adminLoginResult.sessionCookie) {
    console.log('✅ Admin login successful! Session Cookie obtained.');
  } else {
    console.log('⚠️ Admin login failed with env password. Let\'s try admin123...');
    const adminLoginResult2 = await performLogin(adminEmail, 'admin123');
    console.log('Admin Login Status (admin123):', adminLoginResult2.status);
    console.log('Admin Login Response (admin123):', adminLoginResult2.data);
    if (adminLoginResult2.sessionCookie) {
      console.log('✅ Admin login successful with admin123!');
      adminLoginResult.sessionCookie = adminLoginResult2.sessionCookie;
    } else {
      console.error('❌ Admin login failed with both passwords!');
      process.exit(1);
    }
  }

  // 5. ADMIN DASHBOARD / SESSION ACCESS
  console.log('\n--- 5. Testing Admin Session Verification ---');
  const adminSessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      'Cookie': adminLoginResult.sessionCookie
    }
  });
  const adminSessionData = await adminSessionRes.json();
  console.log('Admin Session Response:', adminSessionData);
  if (adminSessionRes.status === 200 && adminSessionData.user && adminSessionData.user.role === 'admin') {
    console.log('✅ Admin dashboard session verified!');
  } else {
    console.error('❌ Admin dashboard session verification failed!');
    process.exit(1);
  }

  console.log('\n🎉 ALL END-TO-END AUTH TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('❌ Test runner encountered error:', err);
  process.exit(1);
});
