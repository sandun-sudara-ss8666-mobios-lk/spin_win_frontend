import assert from 'node:assert/strict';
import { test } from 'node:test';
import { io } from 'socket.io-client';
import axios from 'axios';
import { getSocketConfig } from '../src/realtime/socket-config.ts';

test('preserves the public API prefix with a trailing slash and route slash', () => {
  const client = axios.create({ baseURL: 'https://spin-n-win.mobios.lk/api/v1/' });
  assert.equal(client.getUri({ url: '/auth/login' }), 'https://spin-n-win.mobios.lk/api/v1/auth/login');
});

for (const [url, path] of [
  ['https://spin-n-win.mobios.lk/api/v1/events', '/api/v1/socket.io'],
  ['https://spin-n-win.mobios.lk/api/v1/events/', '/api/v1/socket.io'],
  ['http://localhost:3010/events', '/socket.io'],
]) {
  test(`maps ${url} to the events namespace and ${path} transport`, () => {
    const config = getSocketConfig(url);
    const socket = io(config.url, { path: config.path, autoConnect: false });
    assert.equal(socket.nsp, '/events');
    assert.equal(socket.io.opts.path, path);
    socket.disconnect();
  });
}
