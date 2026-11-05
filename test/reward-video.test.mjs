import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRewardVideoUrl, validateVideoFile, validateVideoDimensions } from '../src/components/wheel/reward-video.ts';

test('resolves video URLs through the configured API base in local and proxied deployments', () => {
  const path = '/api/v1/reward-videos/reward.mp4';
  assert.equal(getRewardVideoUrl(path, 'http://localhost:3010', 'http://localhost:5173'), 'http://localhost:3010/reward-videos/reward.mp4');
  assert.equal(getRewardVideoUrl(path, 'https://spin-n-win.mobios.lk/api/v1/', 'https://display.example'), 'https://spin-n-win.mobios.lk/api/v1/reward-videos/reward.mp4');
  assert.equal(getRewardVideoUrl(path, '/api/v1/', 'https://display.example'), 'https://display.example/api/v1/reward-videos/reward.mp4');
});

test('rejects files exceeding the upload limit or using another format', () => {
  assert.throws(() => validateVideoFile({ name: 'clip.mp4', size: 15_000_001, type: 'video/mp4' }), /15 MB/);
  assert.throws(() => validateVideoFile({ name: 'clip.webm', size: 1000, type: 'video/webm' }), /MP4/);
  assert.doesNotThrow(() => validateVideoFile({ name: 'clip.MP4', size: 15_000_000, type: 'video/mp4' }));
});

test('allows 10-second landscape and portrait 1080p; rejects long, 4K, and unreadable video', () => {
  assert.doesNotThrow(() => validateVideoDimensions(10, 1920, 1080));
  assert.doesNotThrow(() => validateVideoDimensions(10, 1080, 1920));
  assert.throws(() => validateVideoDimensions(10.01, 1920, 1080), /10 seconds/);
  assert.throws(() => validateVideoDimensions(10, 3840, 2160), /1080p/);
  assert.throws(() => validateVideoDimensions(NaN, 0, 0), /10 seconds/);
});

test('uses absolute backend and CDN video URLs without rewriting their origin or path', () => {
  for (const url of ['http://localhost:3010/reward-videos/clip.mp4', 'https://cdn.example/videos/clip.mp4?version=2']) {
    assert.equal(getRewardVideoUrl(url, 'https://spin-n-win.mobios.lk/api/v1/', 'http://localhost:5173'), url);
  }
});
