// The proxy prefix belongs to the transport path, not the Socket.IO namespace.
export function getSocketConfig(socketUrl?: string) {
  const fallback = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000/events` : 'http://localhost:3000/events';
  const url = new URL(socketUrl || fallback, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  // Defensive browser protocol & hostname normalization for local development and exhibition Wi-Fi
  if (typeof window !== 'undefined' && window.location) {
    const isLocalTarget = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isLocalBrowser = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If browser is accessed on HTTP and target localhost specifies HTTPS, downgrade to HTTP to avoid TLS rejection
    if (window.location.protocol === 'http:' && isLocalTarget && url.protocol === 'https:') {
      url.protocol = 'http:';
    }

    // If browser is accessed on a mobile or tablet over LAN IP (e.g. 192.168.x.x), use browser's server host
    if (isLocalTarget && !isLocalBrowser) {
      url.hostname = window.location.hostname;
    }
  }

  const pathname = url.pathname.replace(/\/+$/, '');
  const namespaceStart = pathname.lastIndexOf('/');
  const prefix = pathname.slice(0, namespaceStart);
  const namespace = pathname.slice(namespaceStart);

  return {
    url: `${url.origin}${namespace}`,
    path: `${prefix}/socket.io`,
  };
}
