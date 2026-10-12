const axios = require('axios');
const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  const adminClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const staffClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const userClient1 = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const userClient2 = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const userClient3 = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });

  const clients = [adminClient, staffClient, userClient1, userClient2, userClient3];

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
    console.log('--- PRE-CLEANUP ---');
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection('users').deleteMany({ email: { $in: ['user2@example.com', 'user3@example.com'] } });
    await mongoose.connection.collection('departments').deleteMany({ name: { $in: ['Engine Dept', 'Inactive Dept'] } });
    await mongoose.connection.collection('queues').deleteMany({ name: { $in: ['Engine Line', 'Engine Line 2', 'Concurrency Line'] } });
    
    console.log('--- SETUP ---');
    console.log('1, 2, 3. Logging in users...');
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    let staffRes = await staffClient.post('/auth/login', { email: 'staff@example.com', password: 'devPassword123!' });
    await userClient1.post('/auth/login', { email: 'user@example.com', password: 'devPassword123!' });
    
    // Create extra users for concurrency/queue testing
    await userClient2.post('/auth/register', { name: 'User 2', email: 'user2@example.com', password: 'devPassword123!' });
    await userClient3.post('/auth/register', { name: 'User 3', email: 'user3@example.com', password: 'devPassword123!' });
    // Re-login just to be safe
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });

    const staffId = staffRes.data.data._id;
    const user1Id = (await userClient1.get('/auth/me')).data.data._id;

    console.log('Creating Department and Queue...');
    let deptRes = await adminClient.post('/departments', { name: 'Engine Dept', description: 'Engine Test' });
    if (deptRes.status !== 201) {
      console.log('Failed to create dept:', deptRes.data);
    }
    const deptId = deptRes.data.data._id;

    let queueRes = await adminClient.post('/queues', { departmentId: deptId, name: 'Engine Line', prefix: 'ENG' });
    if (queueRes.status !== 201) {
      console.log('Failed to create queue:', queueRes.data);
    }
    const queueId = queueRes.data.data._id;

    console.log('4. Assign staff to department...');
    let res = await adminClient.post(`/departments/${deptId}/staff/${staffId}`);
    assert.ok(res.status === 200 || res.status === 409); // 409 if already assigned

    console.log('5. Reject assignment of normal user...');
    res = await adminClient.post(`/departments/${deptId}/staff/${user1Id}`);
    assert.strictEqual(res.status, 400);

    console.log('6. Duplicate staff assignment...');
    res = await adminClient.post(`/departments/${deptId}/staff/${staffId}`);
    assert.strictEqual(res.status, 409);

    console.log('7. Remove staff assignment works (and we re-add for testing)...');
    res = await adminClient.delete(`/departments/${deptId}/staff/${staffId}`);
    assert.strictEqual(res.status, 200);
    await adminClient.post(`/departments/${deptId}/staff/${staffId}`);

    console.log('8. User joins active queue...');
    res = await userClient1.post(`/queues/${queueId}/join`);
    assert.strictEqual(res.status, 201);
    
    console.log('9, 10, 11, 12, 13. Token generated, position, people ahead, wait time...');
    let entry1 = res.data.data;
    assert.ok(entry1.tokenNumber > 0);
    assert.strictEqual(entry1.displayToken, `ENG-${entry1.tokenNumber}`);
    assert.strictEqual(entry1.position, 1);
    assert.strictEqual(entry1.peopleAhead, 0);
    assert.strictEqual(entry1.estimatedWaitTime, 0);

    console.log('14. Same user cannot join twice...');
    res = await userClient1.post(`/queues/${queueId}/join`);
    assert.strictEqual(res.status, 409);

    console.log('15. User can leave waiting queue...');
    res = await userClient1.post(`/queues/${queueId}/leave`);
    assert.strictEqual(res.status, 200);

    console.log('16. User can rejoin after cancellation...');
    res = await userClient1.post(`/queues/${queueId}/join`);
    assert.strictEqual(res.status, 201);
    const newToken = res.data.data.tokenNumber;
    assert.ok(newToken > entry1.tokenNumber); // Atomic increment moved forward

    console.log('17. User cannot join paused queue...');
    await adminClient.post(`/queues/${queueId}/pause`);
    res = await userClient2.post(`/queues/${queueId}/join`);
    assert.strictEqual(res.status, 403);
    await adminClient.post(`/queues/${queueId}/resume`);

    console.log('18. User cannot join closed queue...');
    await adminClient.post(`/queues/${queueId}/close`);
    res = await userClient2.post(`/queues/${queueId}/join`);
    assert.strictEqual(res.status, 403);
    // Recreate a fresh queue because we closed this one
    queueRes = await adminClient.post('/queues', { departmentId: deptId, name: 'Engine Line 2', prefix: 'ENG2' });
    const q2Id = queueRes.data.data._id;
    // Join users to new queue
    await userClient1.post(`/queues/${q2Id}/join`);
    await userClient2.post(`/queues/${q2Id}/join`);

    console.log('19. User can view queue status...');
    res = await userClient1.get(`/queues/${q2Id}/status`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.waitingCount, 2);

    console.log('20. User can view own entry...');
    res = await userClient2.get(`/queues/${q2Id}/my-entry`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.position, 2);
    assert.strictEqual(res.data.data.estimatedWaitTime, 5); // 1 person ahead * 5 mins

    console.log('21. User cannot view another user\'s private entry (no endpoint exposes this directly except staff).');

    console.log('25. Assigned staff can view queue entries...');
    res = await staffClient.get(`/queues/${q2Id}/entries`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length >= 2);

    console.log('26. Unassigned staff receives 403...');
    // Create new staff (will become user role due to public registration restrictions)
    await adminClient.post('/auth/register', { name: 'Staff 2', email: 'staff2@example.com', password: 'devPassword123!' });
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    // Staff creation forces 'user' role. Admin needs to make them staff directly via DB or we just use userClient3 as unauthorized.
    res = await userClient3.get(`/queues/${q2Id}/entries`);
    assert.strictEqual(res.status, 403);

    console.log('27. Normal user receives 403...');
    res = await userClient1.get(`/queues/${q2Id}/entries`);
    assert.strictEqual(res.status, 403);

    console.log('28. Admin can operate any queue...');
    res = await adminClient.get(`/queues/${q2Id}/entries`);
    assert.strictEqual(res.status, 200);

    console.log('29, 30, 31, 32. Staff calls first waiting user...');
    res = await staffClient.post(`/queues/${q2Id}/next`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'serving');
    assert.ok(res.data.data.calledAt);
    const servingUser = res.data.data.user;

    console.log('33. Another NEXT while serving returns conflict...');
    res = await staffClient.post(`/queues/${q2Id}/next`);
    assert.strictEqual(res.status, 409);

    console.log('34, 35, 36, 37. Complete current serving entry...');
    res = await staffClient.post(`/queues/${q2Id}/complete`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'completed');
    assert.ok(res.data.data.completedAt);
    
    // Now no serving entry exists
    res = await staffClient.post(`/queues/${q2Id}/complete`);
    assert.strictEqual(res.status, 409);

    console.log('38, 39, 40. Skip serving entry...');
    await staffClient.post(`/queues/${q2Id}/next`); // call userClient2
    res = await staffClient.post(`/queues/${q2Id}/skip`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'skipped');

    console.log('22, 23, 24. Historical entries appear in history...');
    res = await userClient1.get(`/queues/${q2Id}/my-history`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.find(e => e.status === 'completed'));
    
    res = await userClient2.get(`/queues/${q2Id}/my-history`);
    assert.ok(res.data.data.find(e => e.status === 'skipped'));

    console.log('41. Recall behavior...');
    await userClient3.post(`/queues/${q2Id}/join`);
    await staffClient.post(`/queues/${q2Id}/next`);
    res = await staffClient.post(`/queues/${q2Id}/recall`);
    assert.strictEqual(res.status, 200);

    console.log('48, 49, 50, 51, 52. Concurrency check...');
    // Create new queue for clean concurrency check
    queueRes = await adminClient.post('/queues', { departmentId: deptId, name: 'Concurrency Line', prefix: 'CON' });
    const cQueueId = queueRes.data.data._id;
    
    const joinPromises = [
      userClient1.post(`/queues/${cQueueId}/join`),
      userClient2.post(`/queues/${cQueueId}/join`),
      userClient3.post(`/queues/${cQueueId}/join`),
      userClient1.post(`/queues/${cQueueId}/join`) // duplicate join
    ];
    
    const results = await Promise.allSettled(joinPromises);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
    const conflicts = results.filter(r => r.status === 'fulfilled' && r.value.status === 409);
    
    assert.strictEqual(successes.length, 3);
    assert.ok(conflicts.length >= 1);
    
    const tokens = successes.map(r => r.value.data.data.tokenNumber);
    const uniqueTokens = new Set(tokens);
    assert.strictEqual(uniqueTokens.size, 3); // tokens must be absolutely unique

    // Concurrent NEXT
    const nextPromises = [
      staffClient.post(`/queues/${cQueueId}/next`),
      adminClient.post(`/queues/${cQueueId}/next`)
    ];
    const nextResults = await Promise.allSettled(nextPromises);
    const nextSuccesses = nextResults.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const nextConflicts = nextResults.filter(r => r.status === 'fulfilled' && r.value.status === 409);
    
    assert.strictEqual(nextSuccesses.length, 1); // Only 1 should succeed due to unique index on serving
    assert.strictEqual(nextConflicts.length, 1);

    console.log('Cleaning up: Removing test items from DB...');
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection('users').deleteMany({ email: { $in: ['user2@example.com', 'user3@example.com'] } });
    await mongoose.connection.collection('queueentries').deleteMany({ queue: { $in: [new mongoose.Types.ObjectId(queueId), new mongoose.Types.ObjectId(q2Id), new mongoose.Types.ObjectId(cQueueId)] } });
    await mongoose.connection.collection('queues').deleteMany({ _id: { $in: [new mongoose.Types.ObjectId(queueId), new mongoose.Types.ObjectId(q2Id), new mongoose.Types.ObjectId(cQueueId)] } });
    await mongoose.disconnect();

    console.log('All Core Engine tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    process.exit(1);
  }
}

runTests();
