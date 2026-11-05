// The proxy prefix belongs to the transport path, not the Socket.IO namespace.
export function getSocketConfig(socketUrl: string) {
  const url = new URL(socketUrl);
  const pathname = url.pathname.replace(/\/+$/, '');
  const namespaceStart = pathname.lastIndexOf('/');
  const prefix = pathname.slice(0, namespaceStart);
  const namespace = pathname.slice(namespaceStart);

  return {
    url: `${url.origin}${namespace}`,
    path: `${prefix}/socket.io`,
  };
}
