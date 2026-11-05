import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSpinQueue } from '../src/components/queue/load-spin-queue.ts';

test('loads every eligible visitor beyond the first page, newest first', async () => {
  const visitors = Array.from({ length: 235 }, (_, index) => ({
    id: String(index), registeredAt: new Date(2026, 0, 1, 0, index).toISOString(),
  })).reverse();
  const result = await loadSpinQueue(async ({ status, order, limit, offset }) => {
    assert.equal(status, 'WAITING,SELECTED');
    assert.equal(order, 'desc');
    return visitors.slice(offset, offset + limit);
  });
  assert.deepEqual(result, visitors);
});

test('handles empty queues and full final pages', async () => {
  assert.deepEqual(await loadSpinQueue(async () => []), []);
  const visitors = Array.from({ length: 100 }, (_, id) => ({ id: String(id), registeredAt: '2026-01-01' }));
  assert.equal((await loadSpinQueue(async ({ offset, limit }) => visitors.slice(offset, offset + limit))).length, 100);
});

test('does not duplicate visitors when new registrations shift page boundaries', async () => {
  const first = Array.from({ length: 100 }, (_, id) => ({ id: String(id), registeredAt: '2026-01-01' }));
  const result = await loadSpinQueue(async ({ offset }) => offset === 0 ? first : [first[99], { id: 'older', registeredAt: '2025-01-01' }]);
  assert.equal(result.length, 101);
  assert.equal(result.at(-1).id, 'older');
});

test('propagates a failed page instead of presenting a partial queue as complete', async () => {
  await assert.rejects(loadSpinQueue(async () => { throw new Error('Queue unavailable'); }), /Queue unavailable/);
});
