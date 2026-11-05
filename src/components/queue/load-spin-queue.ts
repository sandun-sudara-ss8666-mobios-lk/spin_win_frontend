interface QueuePageParams {
  status: string;
  order: 'desc';
  limit: number;
  offset: number;
}

/** Fetch every page; a larger single request would be capped by the API. */
export async function loadSpinQueue<T extends { id: string; registeredAt: string }>(
  getPage: (params: QueuePageParams) => Promise<T[]>,
): Promise<T[]> {
  const limit = 100;
  const visitors = new Map<string, T>();
  for (let offset = 0; ; offset += limit) {
    const page = await getPage({ status: 'WAITING,SELECTED', order: 'desc', limit, offset });
    for (const visitor of page) visitors.set(visitor.id, visitor);
    if (page.length < limit) break;
  }
  return [...visitors.values()].sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt));
}
