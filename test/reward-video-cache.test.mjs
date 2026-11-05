import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RewardVideoCache } from '../src/components/wheel/reward-video-cache.ts';

class Video extends EventTarget {
  readyState = 0;
  error = null;
  pause() {}
  removeAttribute() {}
  load() {
    if (this.src) queueMicrotask(() => { this.readyState = 2; this.dispatchEvent(new Event('loadeddata')); });
  }
}

const reward = (name = 'one') => ({ rewardId: name, isVideoShow: true, isNoWin: false, videoUrl: `/api/v1/reward-videos/${name}.mp4` });

test('preloads enabled videos for both outcomes, deduplicates URLs, and releases videos', async (t) => {
  let requests = 0;
  let revoked = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response(new Blob(['video'], { type: 'video/mp4' })); });
  t.mock.method(URL, 'createObjectURL', () => `blob:test-${requests}`);
  t.mock.method(URL, 'revokeObjectURL', () => { revoked++; });
  globalThis.document = { createElement: () => new Video() };
  t.after(() => { delete globalThis.document; });
  const cache = new RewardVideoCache('http://backend', 'http://display');
  await cache.sync([reward(), reward(), { ...reward('disabled'), isVideoShow: false }, { ...reward('no-win'), isNoWin: true }]);
  assert.equal(requests, 2);
  assert.ok(cache.get(reward()));
  assert.ok(cache.get({ ...reward('no-win'), isNoWin: true }));
  assert.equal(cache.get({ ...reward(), isVideoShow: false }), null);
  assert.equal(cache.get(reward('other')), null);
  await cache.sync([reward()]);
  assert.equal(requests, 2);
  await cache.sync([]);
  assert.equal(cache.get(reward()), null);
  assert.equal(revoked, 2);
  cache.dispose();
});

test('never returns a partial download and ignores completion after disposal', async (t) => {
  let finish;
  t.mock.method(globalThis, 'fetch', () => new Promise((resolve) => { finish = resolve; }));
  globalThis.document = { createElement: () => new Video() };
  t.after(() => { delete globalThis.document; });
  const cache = new RewardVideoCache('http://backend', 'http://display');
  const pending = cache.sync([reward()]);
  await Promise.resolve();
  assert.equal(cache.get(reward()), null);
  cache.dispose();
  finish(new Response(new Blob(['video'], { type: 'video/mp4' })));
  await pending;
  assert.equal(cache.get(reward()), null);
});

test('preloads when the browser cannot consume the response using blob()', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    const response = new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'video/mp4' } });
    response.blob = async () => { throw new TypeError('Failed to fetch'); };
    return response;
  });
  globalThis.document = { createElement: () => new Video() };
  t.after(() => { delete globalThis.document; });
  const cache = new RewardVideoCache('http://backend', 'http://display');
  t.after(() => cache.dispose());
  await cache.sync([reward()]);
  assert.ok(cache.get(reward()), 'complete response bytes should still prepare a playable video');
});

test('missing files fall back and do not prevent other videos loading', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => url.includes('missing')
    ? new Response(null, { status: 404 }) : new Response(new Blob(['video'], { type: 'video/mp4' })));
  globalThis.document = { createElement: () => new Video() };
  t.after(() => { delete globalThis.document; });
  const cache = new RewardVideoCache('http://backend', 'http://display');
  await cache.sync([reward('missing'), reward('good')]);
  assert.equal(cache.get(reward('missing')), null);
  assert.ok(cache.get(reward('good')));
  cache.dispose();
});

test('downloads at most two videos concurrently', async (t) => {
  let running = 0;
  let peak = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    peak = Math.max(peak, ++running);
    await new Promise((resolve) => setTimeout(resolve, 5));
    running--;
    return new Response(new Blob(['video'], { type: 'video/mp4' }));
  });
  globalThis.document = { createElement: () => new Video() };
  t.after(() => { delete globalThis.document; });
  const cache = new RewardVideoCache('http://backend', 'http://display');
  await cache.sync(['one', 'two', 'three', 'four'].map(reward));
  assert.equal(peak, 2);
  cache.dispose();
});
