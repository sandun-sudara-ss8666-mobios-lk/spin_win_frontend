export const MAX_REWARD_VIDEO_BYTES = 15_000_000;

export function getRewardVideoUrl(path: string, apiBase: string | undefined, origin: string): string {
  if (/^https?:\/\//i.test(path)) {
    if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(path)) {
      const clean = path.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(?:api\/v1\/)?/, '');
      return new URL(`/api/v1/${clean}`, origin).href;
    }
    return new URL(path).href;
  }
  // The DB stores the public path; local Nest runs without the Nginx /api/v1 prefix.
  const filename = path.split('/reward-videos/')[1];
  if (!filename || filename.includes('/') || filename.includes('..')) throw new Error('Invalid reward video URL');
  const base = new URL(apiBase || '/', origin);
  return new URL(`${base.pathname.replace(/\/$/, '')}/reward-videos/${filename}`, base.origin).href;
}

export function validateVideoFile(file: { name: string; size: number; type: string }): void {
  if (!/\.mp4$/i.test(file.name) || (file.type && file.type !== 'video/mp4')) throw new Error('Choose an MP4 video');
  if (!file.size || file.size > MAX_REWARD_VIDEO_BYTES) throw new Error('Video must be between 1 byte and 15 MB');
}

export function validateVideoDimensions(duration: number, width: number, height: number): void {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Video duration must be valid');
  if (width <= 0 || height <= 0 || Math.max(width, height) > 1920 || Math.min(width, height) > 1080) {
    throw new Error('Video must be at most 1080p (1920 × 1080 or portrait equivalent)');
  }
}

export async function validateVideoUpload(file: File): Promise<void> {
  validateVideoFile(file);
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Video metadata could not be read')), 10_000);
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        try { validateVideoDimensions(video.duration, video.videoWidth, video.videoHeight); resolve(); }
        catch (error) { reject(error); }
      };
      video.onerror = () => { clearTimeout(timer); reject(new Error('This browser cannot read the video. Use H.264/AAC MP4.')); };
      video.src = url;
    });
  } finally {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
