const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  const instance = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  let cookie = '';
  
  instance.interceptors.request.use(config => {
    if (cookie) config.headers.Cookie = cookie;
    return config;
  });

  instance.interceptors.response.use(response => {
    if (response.headers['set-cookie']) {
      cookie = response.headers['set-cookie'][0];
    }
    return response;
  });

  try {
    console.log('1. Testing health endpoint...');
    let res = await instance.get('/health');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.message, 'QueueZero API is running');

    console.log('2. Testing successful registration...');
    res = await instance.post('/auth/register', { name: 'Reg Test', email: 'reg@example.com', password: 'password123' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.role, 'user');
    assert.ok(!res.data.data.password);

    console.log('3. Testing duplicate email registration...');
    res = await instance.post('/auth/register', { name: 'Reg Test 2', email: 'reg@example.com', password: 'password123' });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.success, false);
    
    console.log('4. Testing role escalation (staff)...');
    res = await instance.post('/auth/register', { name: 'Staff Esc', email: 'staffesc@example.com', password: 'password123', role: 'staff' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.role, 'user');

    console.log('5. Testing role escalation (admin)...');
    res = await instance.post('/auth/register', { name: 'Admin Esc', email: 'adminesc@example.com', password: 'password123', role: 'admin' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.role, 'user');

    console.log('6. Testing successful login...');
    res = await instance.post('/auth/login', { email: 'reg@example.com', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.email, 'reg@example.com');
    assert.ok(cookie.includes('token='));

    console.log('7. Testing wrong password...');
    res = await instance.post('/auth/login', { email: 'reg@example.com', password: 'wrongpassword' });
    assert.strictEqual(res.status, 401);
    
    console.log('8. Testing non-existent email...');
    res = await instance.post('/auth/login', { email: 'none@example.com', password: 'password123' });
    assert.strictEqual(res.status, 401);

    console.log('9. Testing GET /api/auth/me while authenticated...');
    await instance.post('/auth/login', { email: 'reg@example.com', password: 'password123' });
    res = await instance.get('/auth/me');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.email, 'reg@example.com');

    console.log('10. Testing logout...');
    res = await instance.post('/auth/logout');
    assert.strictEqual(res.status, 200);
    cookie = '';

    console.log('11. Testing GET /api/auth/me without authentication...');
    res = await instance.get('/auth/me');
    assert.strictEqual(res.status, 401);

    /*
    console.log('12. Testing protected route access without auth...');
    res = await instance.get('/auth/admin-only');
    assert.strictEqual(res.status, 401);

    console.log('13. Testing Admin authorization...');
    res = await instance.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    res = await instance.get('/auth/admin-only');
    assert.strictEqual(res.status, 200);
    res = await instance.get('/auth/staff-only');
    assert.strictEqual(res.status, 200);

    console.log('14. Testing Staff authorization...');
    res = await instance.post('/auth/login', { email: 'staff@example.com', password: 'devPassword123!' });
    res = await instance.get('/auth/staff-only');
    assert.strictEqual(res.status, 200);
    res = await instance.get('/auth/admin-only');
    assert.strictEqual(res.status, 403);

    console.log('15. Testing Normal user rejected from admin-only operation...');
    res = await instance.post('/auth/login', { email: 'user@example.com', password: 'devPassword123!' });
    res = await instance.get('/auth/admin-only');
    assert.strictEqual(res.status, 403);
    res = await instance.get('/auth/staff-only');
    assert.strictEqual(res.status, 403);
    */

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) console.error(error.response.data);
    process.exit(1);
  }
}

runTests();
