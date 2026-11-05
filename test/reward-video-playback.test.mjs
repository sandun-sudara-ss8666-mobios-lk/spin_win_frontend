import assert from 'node:assert/strict';
import { test } from 'node:test';
import { playRewardVideo } from '../src/components/wheel/reward-video-playback.ts';

class Video extends EventTarget {
  time = 0;
  seeks = 0;
  seeking = false;
  paused = true;
  get currentTime() { return this.time; }
  set currentTime(value) { this.time = value; this.seeks++; this.seeking = true; }
  async play() { this.paused = false; this.dispatchEvent(new Event('playing')); }
  pause() { this.paused = true; }
}

test('does not initiate an unnecessary seek for a newly preloaded video at zero', (t) => {
  const video = new Video();
  let failures = 0;
  t.after(playRewardVideo(video, () => { failures++; }));
  assert.equal(video.seeks, 0);
  assert.equal(video.paused, false);
  assert.equal(failures, 0);
});

test('keeps the video visible during Firefox playing → seeking → waiting → seeked on replay', (t) => {
  const video = new Video();
  video.time = 5;
  let failures = 0;
  t.after(playRewardVideo(video, () => { failures++; }));
  assert.equal(video.currentTime, 0);
  assert.equal(video.seeking, true);
  video.dispatchEvent(new Event('waiting'));
  assert.equal(failures, 0, 'waiting while seeking must not remove a cached video');
  assert.equal(video.paused, false);
  video.seeking = false;
  video.dispatchEvent(new Event('seeked'));
  video.dispatchEvent(new Event('playing'));
  assert.equal(failures, 0);
});

test('still falls back on a real playback stall outside a seek', (t) => {
  const video = new Video();
  let failures = 0;
  t.after(playRewardVideo(video, () => { failures++; }));
  video.seeking = false;
  video.dispatchEvent(new Event('waiting'));
  assert.equal(failures, 1);
  assert.equal(video.paused, true);
});

test('falls back once on rejected playback and ignores events after cleanup', async () => {
  const video = new Video();
  video.play = async () => { throw new Error('Playback denied'); };
  let failures = 0;
  const cleanup = playRewardVideo(video, () => { failures++; });
  await Promise.resolve();
  assert.equal(failures, 1);
  video.dispatchEvent(new Event('error'));
  assert.equal(failures, 1);
  cleanup();
  video.dispatchEvent(new Event('error'));
  assert.equal(failures, 1);
});
