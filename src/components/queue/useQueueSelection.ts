import { useCallback, useEffect, useRef, useState } from 'react';
import { participationsApi } from '../../api';
import { Participation } from '../../types';

/** Serialize selections: rapid scrolling must never leave the server on an older visitor. */
export function useQueueSelection(queue: Participation[], locked: boolean, onError: (message: string) => void) {
  const [focused, setFocused] = useState<Participation | null>(null);
  const [selected, setSelected] = useState<Participation | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectingRef = useRef(false);
  const failedId = useRef<string | null>(null);

  useEffect(() => {
    if (locked) return;
    if (focused && queue.some((item) => item.id === focused.id)) return;
    failedId.current = null;
    setFocused(queue.find((item) => item.status === 'SELECTED') || queue[0] || null);
    setSelected(null);
  }, [queue, focused, locked]);

  useEffect(() => {
    if (locked || selectingRef.current || !focused || selected?.id === focused.id || failedId.current === focused.id) return;
    selectingRef.current = true;
    setIsSelecting(true);
    participationsApi.select(focused.id)
      .then((updated) => setSelected(updated))
      .catch((error: Error) => {
        failedId.current = focused.id;
        onError(error.message || 'Unable to select visitor. Scroll to try again.');
      })
      .finally(() => {
        selectingRef.current = false;
        setIsSelecting(false);
      });
  }, [focused, selected, locked, isSelecting, onError]);

  const selectParticipant = useCallback((participant: Participation) => {
    if (locked) return;
    failedId.current = null;
    setFocused({ ...participant });
  }, [locked]);

  const syncSelection = useCallback((participant: Participation) => {
    if (locked || selectingRef.current) return;
    failedId.current = null;
    setFocused(participant);
    setSelected(participant);
  }, [locked]);

  return { focused, selected, isSelecting, selectParticipant, syncSelection };
}
