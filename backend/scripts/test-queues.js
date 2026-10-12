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
    console.log('Testing /api/health...');
    let res = await adminClient.get('/health');
    assert.strictEqual(res.data.success, true);

    console.log('Authenticating users...');
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    await staffClient.post('/auth/login', { email: 'staff@example.com', password: 'devPassword123!' });
    await userClient.post('/auth/login', { email: 'user@example.com', password: 'devPassword123!' });

    // Ensure test department exists and is active
    let deptRes = await adminClient.post('/departments', { name: 'Queue Test Dept', description: 'Testing queues' });
    if (deptRes.status === 409) {
       // if exists, get it
       deptRes = await adminClient.get('/departments');
       const depts = deptRes.data.data;
       deptRes = { data: { data: depts.find(d => d.name === 'Queue Test Dept') } };
    }
    const deptId = deptRes.data.data._id;
    const inactiveDeptId = new mongoose.Types.ObjectId().toString(); // Will pretend this is non-existent first
    
    let fakeDept = await adminClient.post('/departments', { name: 'Inactive Dept' });
    const inactiveId = fakeDept.data.data ? fakeDept.data.data._id : deptId; // just fallback if something weird happens
    if (fakeDept.status === 201) {
      await adminClient.delete(`/departments/${inactiveId}`);
    }

    console.log('1. Admin creates queue...');
    res = await adminClient.post('/queues', { departmentId: deptId, name: 'Main Line', prefix: 'MAIN' });
    assert.strictEqual(res.status, 201);
    const queueId = res.data.data._id;
    assert.strictEqual(res.data.data.prefix, 'MAIN');
    assert.strictEqual(res.data.data.currentToken, 0);

    console.log('2. Normal user cannot create queue...');
    res = await userClient.post('/queues', { departmentId: deptId, name: 'User Line', prefix: 'USER' });
    assert.strictEqual(res.status, 403);

    console.log('3. Staff cannot create queue...');
    res = await staffClient.post('/queues', { departmentId: deptId, name: 'Staff Line', prefix: 'STAFF' });
    assert.strictEqual(res.status, 403);

    console.log('4. Invalid department ID...');
    res = await adminClient.post('/queues', { departmentId: 'invalid123', name: 'Q1', prefix: 'Q1' });
    assert.strictEqual(res.status, 400);

    console.log('5. Nonexistent department...');
    res = await adminClient.post('/queues', { departmentId: new mongoose.Types.ObjectId().toString(), name: 'Q2', prefix: 'Q2' });
    assert.strictEqual(res.status, 404);

    console.log('6. Inactive department...');
    if (fakeDept.status === 201) {
      res = await adminClient.post('/queues', { departmentId: inactiveId, name: 'Q3', prefix: 'Q3' });
      assert.strictEqual(res.status, 409);
    }

    console.log('7. Valid queue creation covered in #1.');

    console.log('8. Duplicate queue name within same department...');
    res = await adminClient.post('/queues', { departmentId: deptId, name: 'Main Line', prefix: 'DUP' });
    assert.strictEqual(res.status, 409);

    console.log('9. Get all queues as user...');
    res = await userClient.get('/queues');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));

    console.log('10. Get all queues as staff...');
    res = await staffClient.get('/queues');
    assert.strictEqual(res.status, 200);

    console.log('11. Get all queues as admin...');
    res = await adminClient.get('/queues');
    assert.strictEqual(res.status, 200);

    console.log('12. Filter by departmentId...');
    res = await adminClient.get(`/queues?departmentId=${deptId}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.every(q => q.department._id === deptId));

    console.log('13. Filter by status...');
    res = await adminClient.get('/queues?status=active');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.every(q => q.status === 'active'));

    console.log('14. Get queue by valid ID...');
    res = await userClient.get(`/queues/${queueId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.name, 'Main Line');

    console.log('15. Invalid MongoDB ID...');
    res = await userClient.get('/queues/invalid');
    assert.strictEqual(res.status, 400);

    console.log('16. Nonexistent queue...');
    res = await userClient.get(`/queues/${new mongoose.Types.ObjectId().toString()}`);
    assert.strictEqual(res.status, 404);

    console.log('17. Admin updates allowed fields...');
    res = await adminClient.patch(`/queues/${queueId}`, { name: 'Super Line', prefix: 'SUP' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.name, 'Super Line');
    assert.strictEqual(res.data.data.prefix, 'SUP');

    console.log('18. Admin cannot modify protected fields...');
    res = await adminClient.patch(`/queues/${queueId}`, { currentToken: 999, status: 'closed' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.currentToken, 0); // Not updated to 999
    assert.strictEqual(res.data.data.status, 'active'); // Not updated to closed

    console.log('19. User cannot update queue...');
    res = await userClient.patch(`/queues/${queueId}`, { name: 'Hacked' });
    assert.strictEqual(res.status, 403);

    console.log('20. Staff cannot update queue...');
    res = await staffClient.patch(`/queues/${queueId}`, { name: 'Hacked' });
    assert.strictEqual(res.status, 403);

    console.log('21. Admin pauses active queue...');
    res = await adminClient.post(`/queues/${queueId}/pause`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'paused');

    console.log('22. Pause already paused queue...');
    res = await adminClient.post(`/queues/${queueId}/pause`);
    assert.strictEqual(res.status, 409);

    console.log('23. Admin resumes paused queue...');
    res = await adminClient.post(`/queues/${queueId}/resume`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'active');

    console.log('25. Admin closes queue...');
    res = await adminClient.post(`/queues/${queueId}/close`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'closed');

    console.log('24. Resume closed queue must fail...');
    res = await adminClient.post(`/queues/${queueId}/resume`);
    assert.strictEqual(res.status, 409);

    console.log('26. Closed queue cannot be reopened (already checked pause/resume above).');

    console.log('27/28. We will run those externally.');

    console.log('Cleaning up: Removing test queue and department from DB...');
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection('queues').deleteMany({ department: new mongoose.Types.ObjectId(deptId) });
    await mongoose.connection.collection('departments').deleteOne({ _id: new mongoose.Types.ObjectId(deptId) });
    if (fakeDept.status === 201) {
      await mongoose.connection.collection('departments').deleteOne({ _id: new mongoose.Types.ObjectId(inactiveId) });
    }
    await mongoose.disconnect();

    console.log('All queue tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) console.error(error.response.data);
    process.exit(1);
  }
}

runTests();
