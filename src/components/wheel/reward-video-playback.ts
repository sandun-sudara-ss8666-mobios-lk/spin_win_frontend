/** Start a prepared clip and return cleanup for popup close/unmount. */
export function playRewardVideo(video: HTMLVideoElement, onFailure: () => void): () => void {
  let active = true;
  let started = false;
  const fail = () => {
    if (!active) return;
    active = false;
    video.pause();
    onFailure();
  };
  const timer = setTimeout(fail, 800);
  const playing = () => { started = true; clearTimeout(timer); };
  // Firefox can emit playing before the seek to the beginning finishes.
  // Its subsequent waiting event is expected, even for a fully cached Blob.
  const waiting = () => { if (started && !video.seeking) fail(); };
  video.addEventListener('playing', playing);
  video.addEventListener('waiting', waiting);
  video.addEventListener('error', fail);
  try {
    if (video.currentTime !== 0) video.currentTime = 0;
    void video.play().catch(fail);
  } catch { fail(); }
  return () => {
    active = false;
    clearTimeout(timer);
    video.pause();
    video.removeEventListener('playing', playing);
    video.removeEventListener('waiting', waiting);
    video.removeEventListener('error', fail);
  };
}
