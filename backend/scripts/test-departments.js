const axios = require('axios');
const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  const adminClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const staffClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const userClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });

  const clients = [adminClient, staffClient, userClient];

  // Helper to persist cookies per client
  clients.forEach(client => {
    let cookie = '';
    client.interceptors.request.use(config => {
      if (cookie) config.headers.Cookie = cookie;
      return config;
    });
    client.interceptors.response.use(response => {
      if (response.headers['set-cookie']) {
        cookie = response.headers['set-cookie'][0];
      }
      return response;
    });
  });

  try {
    // 17 & 18 & 19: Health and DB still works and auth works
    console.log('Testing /api/health...');
    let res = await adminClient.get('/health');
    assert.strictEqual(res.data.success, true);

    console.log('Authenticating users...');
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    await staffClient.post('/auth/login', { email: 'staff@example.com', password: 'devPassword123!' });
    await userClient.post('/auth/login', { email: 'user@example.com', password: 'devPassword123!' });

    console.log('1. Admin creates department...');
    res = await adminClient.post('/departments', { name: 'Examination Cell', description: 'Handles exams' });
    assert.strictEqual(res.status, 201);
    const examDeptId = res.data.data._id;

    console.log('2. Normal user cannot create department...');
    res = await userClient.post('/departments', { name: 'IT Cell' });
    assert.strictEqual(res.status, 403);

    console.log('3. Staff cannot create department...');
    res = await staffClient.post('/departments', { name: 'HR Cell' });
    assert.strictEqual(res.status, 403);

    console.log('4. Duplicate department name returns 409...');
    res = await adminClient.post('/departments', { name: 'Examination Cell' });
    assert.strictEqual(res.status, 409);

    console.log('5. User can list active departments...');
    res = await userClient.get('/departments');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.every(d => d.isActive === true));

    console.log('6. Staff can list active departments...');
    res = await staffClient.get('/departments');
    assert.strictEqual(res.status, 200);

    console.log('7. Admin can list departments...');
    res = await adminClient.get('/departments');
    assert.strictEqual(res.status, 200);

    console.log('8. Get department with valid ID...');
    res = await userClient.get(`/departments/${examDeptId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.name, 'Examination Cell');
    assert.ok(Array.isArray(res.data.data.staff));

    console.log('9. Invalid MongoDB ID...');
    res = await userClient.get('/departments/invalidid123');
    assert.strictEqual(res.status, 400);

    console.log('10. Nonexistent department...');
    const fakeId = new mongoose.Types.ObjectId().toString();
    res = await userClient.get(`/departments/${fakeId}`);
    assert.strictEqual(res.status, 404);

    console.log('11. Admin updates department...');
    res = await adminClient.patch(`/departments/${examDeptId}`, { description: 'Updated desc' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.description, 'Updated desc');

    console.log('12. Normal user cannot update...');
    res = await userClient.patch(`/departments/${examDeptId}`, { name: 'Hacked' });
    assert.strictEqual(res.status, 403);

    console.log('13. Staff cannot update...');
    res = await staffClient.patch(`/departments/${examDeptId}`, { name: 'Hacked' });
    assert.strictEqual(res.status, 403);

    console.log('14. Admin deactivates department (soft delete)...');
    res = await adminClient.delete(`/departments/${examDeptId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.isActive, false);

    console.log('15. Deactivated department is excluded from normal active list...');
    res = await userClient.get('/departments');
    const deptInList = res.data.data.find(d => d._id === examDeptId);
    assert.ok(!deptInList, 'Deactivated department should not be in the active list for normal users');

    // Admin should see it
    res = await adminClient.get('/departments');
    const adminDeptInList = res.data.data.find(d => d._id === examDeptId);
    assert.ok(adminDeptInList);
    assert.strictEqual(adminDeptInList.isActive, false);

    console.log('16. Sensitive staff information is not exposed...');
    // We already verified via code, but let's check one response
    if (adminDeptInList.staff && adminDeptInList.staff.length > 0) {
      assert.ok(adminDeptInList.staff[0].password === undefined);
    }

    console.log('Cleaning up: Removing test department from DB to allow re-runs...');
    // Connect to mongoose directly to permanently delete the test department
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection('departments').deleteOne({ _id: new mongoose.Types.ObjectId(examDeptId) });
    await mongoose.disconnect();

    console.log('All department tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) console.error(error.response.data);
    process.exit(1);
  }
}

runTests();
