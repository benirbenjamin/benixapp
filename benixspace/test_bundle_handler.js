import handler from './api/index.js';
import { EventEmitter } from 'events';

class MockReq {
  constructor(method, url, body = {}) {
    this.method = method;
    this.url = url;
    this.headers = { 'content-type': 'application/json' };
    this.query = {};
    this.body = body;
  }
}

class MockRes extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
    this.headersSent = false;
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  header(k, v) {
    this.headers[k] = v;
    return this;
  }
  json(data) {
    this.body = data;
    this.headersSent = true;
    this.emit('finish');
    return this;
  }
  send(data) {
    this.body = data;
    this.headersSent = true;
    this.emit('finish');
    return this;
  }
}

async function test() {
  console.log('Testing GET /api/health...');
  const res1 = new MockRes();
  await handler(new MockReq('GET', '/api/health'), res1);
  console.log('Health Result:', res1.statusCode, res1.body);

  console.log('\nTesting POST /api/auth/login with wrong password...');
  const res2 = new MockRes();
  await handler(new MockReq('POST', '/api/auth/login', { email: 'benirabole1@gmail.com', password: 'wrong_password_test' }), res2);
  console.log('Login (wrong pass) Result:', res2.statusCode, res2.body);

  console.log('\nTesting POST /api/auth/login with missing email...');
  const res3 = new MockRes();
  await handler(new MockReq('POST', '/api/auth/login', {}), res3);
  console.log('Login (missing) Result:', res3.statusCode, res3.body);

  process.exit(0);
}

test();
