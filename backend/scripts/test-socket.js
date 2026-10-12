const axios = require('axios');
const assert = require('assert');
const mongoose = require('mongoose');
const { io } = require('socket.io-client');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  const adminClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  const userClient = axios.create({ baseURL: API_URL, validateStatus: () => true, withCredentials: true });
  let userCookie = '';

  const clients = [
    { client: adminClient },
    { client: userClient, captureSocketCookie: true }
  ];

  clients.forEach(({ client, captureSocketCookie }) => {
    let cookie = '';
    client.interceptors.request.use(config => {
      if (cookie) config.headers.Cookie = cookie;
      return config;
    });
    client.interceptors.response.use(response => {
      if (response.headers['set-cookie']) {
        const tokenCookie = response.headers['set-cookie']
          .map((setCookie) => setCookie.split(';', 1)[0])
          .find((cookieValue) => /^token=[^;]+$/.test(cookieValue));
        if (tokenCookie) {
          cookie = tokenCookie;
          if (captureSocketCookie) userCookie = tokenCookie;
        }
      }
      return response;
    });
  });

  try {
    console.log('--- SETUP ---');
    console.log('Logging in...');
    await adminClient.post('/auth/login', { email: 'admin@example.com', password: 'devPassword123!' });
    await userClient.post('/auth/login', { email: 'user@example.com', password: 'devPassword123!' });

    // Wipe test data
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection('departments').deleteMany({ name: 'Socket Dept' });
    await mongoose.connection.collection('queues').deleteMany({ name: 'Socket Queue' });
    
    // Create Dept & Queue
    const deptRes = await adminClient.post('/departments', { name: 'Socket Dept' });
    const deptId = deptRes.data.data._id;
    const queueRes = await adminClient.post('/queues', { departmentId: deptId, name: 'Socket Queue', prefix: 'SQ' });
    const queueId = queueRes.data.data._id;

    console.log('--- TESTING SOCKETS ---');

    console.log('1. Unauthenticated socket connection is rejected...');
    const unauthSocket = io(SOCKET_URL, { reconnection: false });
    const unauthPromise = new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => resolve(err.message));
      unauthSocket.on('connect', () => resolve('SHOULD_NOT_CONNECT'));
    });
    const unauthResult = await unauthPromise;
    assert.strictEqual(unauthResult.includes('Authentication error'), true);
    unauthSocket.close();

    console.log('2. Authenticated user can connect...');
    const authSocket = io(SOCKET_URL, {
      extraHeaders: {
        cookie: userCookie || ''
      },
      reconnection: false
    });

    const connectPromise = new Promise((resolve) => {
      authSocket.on('connect', () => resolve(true));
      authSocket.on('connect_error', (err) => {
        console.log('Authenticated socket connection failed.');
        resolve(false);
      });
    });
    const connected = await connectPromise;
    assert.strictEqual(connected, true);
    assert.ok(userCookie, 'Login response did not include an authentication cookie');

    console.log('3. User joins queue room...');
    authSocket.emit('joinQueueRoom', { queueId });

    console.log('4. User joins -> real-time update emitted...');
    const userUpdatePromise = new Promise(resolve => {
      authSocket.once('user:queue:updated', (data) => resolve(data));
    });
    const queueUpdatePromise = new Promise(resolve => {
      authSocket.once('queue:updated', (data) => resolve(data));
    });

    // Trigger REST join
    const joinRes = await userClient.post(`/queues/${queueId}/join`);
    assert.strictEqual(joinRes.status, 201);

    const userUpdate = await userUpdatePromise;
    const queueUpdate = await queueUpdatePromise;
    
    assert.strictEqual(userUpdate.tokenNumber, 1);
    assert.strictEqual(userUpdate.position, 1);
    assert.strictEqual(queueUpdate.waitingCount, 1);

    console.log('5. Staff NEXT -> real-time update emitted...');
    const nextQueueUpdatePromise = new Promise(resolve => {
      authSocket.once('queue:updated', (data) => resolve(data));
    });
    const nextEntryUpdatePromise = new Promise(resolve => {
      authSocket.once('queue:entry:updated', (data) => resolve(data));
    });
    const nextUserUpdatePromise = new Promise(resolve => {
      authSocket.once('user:queue:updated', (data) => resolve(data));
    });

    const nextRes = await adminClient.post(`/queues/${queueId}/next`);
    assert.strictEqual(nextRes.status, 200);

    const nextQueueUpdate = await nextQueueUpdatePromise;
    const nextEntryEvent = await nextEntryUpdatePromise;
    const nextUserUpdate = await nextUserUpdatePromise;

    assert.strictEqual(nextQueueUpdate.currentToken, 1);
    assert.strictEqual(nextEntryEvent.queueId, queueId);
    const entriesRes = await adminClient.get(`/queues/${queueId}/entries`);
    const nextEntryUpdate = entriesRes.data.data.find((entry) => entry.tokenNumber === nextQueueUpdate.currentToken);
    assert.strictEqual(nextEntryUpdate.status, 'serving');
    assert.strictEqual(nextUserUpdate.status, 'serving');
    assert.strictEqual(nextUserUpdate.position, 0);

    console.log('6. PAUSE -> real-time status update...');
    const pausePromise = new Promise(resolve => {
      authSocket.once('queue:status:updated', (data) => resolve(data));
    });
    await adminClient.post(`/queues/${queueId}/pause`);
    const pauseUpdate = await pausePromise;
    assert.strictEqual(pauseUpdate.status, 'paused');

    console.log('7. COMPLETE -> real-time update emitted...');
    const completePromise = new Promise(resolve => {
      authSocket.once('user:queue:updated', (data) => resolve(data));
    });
    await adminClient.post(`/queues/${queueId}/complete`);
    const completeUpdate = await completePromise;
    assert.strictEqual(completeUpdate.status, 'completed');

    console.log('Closing connections and cleaning up...');
    authSocket.close();
    
    await mongoose.connection.collection('queueentries').deleteMany({ queue: new mongoose.Types.ObjectId(queueId) });
    await mongoose.connection.collection('queues').deleteOne({ _id: new mongoose.Types.ObjectId(queueId) });
    await mongoose.connection.collection('departments').deleteOne({ _id: new mongoose.Types.ObjectId(deptId) });
    await mongoose.disconnect();

    console.log('Socket tests passed successfully!');
  } catch (error) {
    console.error('Test failed:', error.name || 'Error');
    if (error.response) console.error('HTTP response status:', error.response.status);
    process.exit(1);
  }
}

runTests();
