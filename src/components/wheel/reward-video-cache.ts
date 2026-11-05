import { getRewardVideoUrl, MAX_REWARD_VIDEO_BYTES } from './reward-video.ts';

interface VideoSource {
  isNoWin?: boolean;
  isVideoShow?: boolean;
  videoUrl?: string | null;
}

interface CachedVideo {
  controller: AbortController;
  video?: HTMLVideoElement;
  blobUrl?: string;
  ready: boolean;
  failed: boolean;
}

export class RewardVideoCache {
  private entries = new Map<string, CachedVideo>();
  private apiBase: string | undefined;
  private origin: string;
  private loading: Promise<void> = Promise.resolve();

  constructor(apiBase: string | undefined, origin: string) {
    this.apiBase = apiBase;
    this.origin = origin;
  }

  private url(source: VideoSource): string | null {
    if (!source.isVideoShow || !source.videoUrl) return null;
    try { return getRewardVideoUrl(source.videoUrl, this.apiBase, this.origin); }
    catch { return null; }
  }

  get(source?: VideoSource | null): HTMLVideoElement | null {
    const url = source && this.url(source);
    const entry = url && this.entries.get(url);
    return entry && entry.ready && entry.video && !entry.video.error && entry.video.readyState >= 2
      ? entry.video : null;
  }

  async sync(sources: VideoSource[]): Promise<void> {
    const urls = new Set(sources.map((source) => this.url(source)).filter((url): url is string => !!url));
    for (const [url, entry] of this.entries) {
      if (!urls.has(url) || entry.failed) {
        this.release(entry);
        this.entries.delete(url);
      }
    }
    const pending: Array<[string, CachedVideo]> = [];
    for (const url of urls) {
      if (this.entries.has(url)) continue;
      const entry = { controller: new AbortController(), ready: false, failed: false };
      this.entries.set(url, entry);
      pending.push([url, entry]);
    }
    // Avoid flooding the network while the queue and wheel are loading.
    const worker = async () => {
      for (let item = pending.shift(); item; item = pending.shift()) {
        if (!item[1].controller.signal.aborted) await this.download(...item);
      }
    };
    // Serialize batches too, so refreshes cannot exceed the two-download limit.
    this.loading = this.loading.then(async () => { await Promise.all([worker(), worker()]); });
    await this.loading;
  }

  private async download(url: string, entry: CachedVideo): Promise<void> {
    const timer = setTimeout(() => entry.controller.abort(), 60_000);
    try {
      const response = await fetch(url, { signal: entry.controller.signal });
      if (!response.ok || Number(response.headers.get('content-length')) > MAX_REWARD_VIDEO_BYTES) throw new Error('Video unavailable');
      // Some browsers fail response.blob() for otherwise valid MP4 downloads.
      // Read the complete bytes first, then create our own browser-local Blob.
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > MAX_REWARD_VIDEO_BYTES || entry.controller.signal.aborted) throw new Error('Video unavailable');
      if (this.entries.get(url) !== entry) return;
      const blob = new Blob([bytes], { type: 'video/mp4' });
      entry.blobUrl = URL.createObjectURL(blob);
      const video = document.createElement('video');
      entry.video = video;
      video.preload = 'auto';
      video.playsInline = true;
      video.loop = false;
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          video.removeEventListener('loadeddata', loaded);
          video.removeEventListener('error', failed);
          entry.controller.signal.removeEventListener('abort', failed);
        };
        const loaded = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('Video could not be prepared')); };
        video.addEventListener('loadeddata', loaded);
        video.addEventListener('error', failed);
        entry.controller.signal.addEventListener('abort', failed, { once: true });
        video.src = entry.blobUrl!;
        video.load();
      });
      if (this.entries.get(url) === entry && !entry.controller.signal.aborted) entry.ready = true;
    } catch {
      entry.failed = true;
      this.release(entry);
    } finally {
      clearTimeout(timer);
    }
  }

  private release(entry: CachedVideo): void {
    entry.controller.abort();
    entry.ready = false;
    if (entry.video) {
      entry.video.pause();
      entry.video.removeAttribute('src');
      entry.video.load();
      entry.video = undefined;
    }
    if (entry.blobUrl) { URL.revokeObjectURL(entry.blobUrl); entry.blobUrl = undefined; }
  }

  dispose(): void {
    for (const entry of this.entries.values()) this.release(entry);
    this.entries.clear();
  }
}
