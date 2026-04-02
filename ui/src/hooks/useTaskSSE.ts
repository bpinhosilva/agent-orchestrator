import { useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Task } from '../api/tasks';

export const useTaskSSE = (
  projectId: string | undefined,
  onTaskUpdate: (event: string, task: Task) => void
) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const callbackRef = useRef(onTaskUpdate);

  // Keep the callback ref current without re-running the SSE effect
  useEffect(() => {
    callbackRef.current = onTaskUpdate;
  }, [onTaskUpdate]);

  useEffect(() => {
    if (!projectId) return;

    abortControllerRef.current = new AbortController();

    const connect = async () => {
      try {
        await fetchEventSource(`/api/v1/projects/${projectId}/tasks/events`, {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
          },
          credentials: 'include',
          signal: abortControllerRef.current?.signal,
          onmessage(msg) {
            if (!msg.data) return;
            try {
              const data = JSON.parse(msg.data);
              if (data && data.task && data.event) {
                callbackRef.current(data.event, data.task);
              }
            } catch (err) {
              console.error('Failed to parse SSE message', err);
            }
          },
          onclose() {
            // Server closed connection, let fetchEventSource retry naturally if appropriate
          },
          onerror(err) {
            console.error('SSE connection error:', err);
          },
        });
      } catch (err) {
        console.error('SSE initialization failed', err);
      }
    };

    connect();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId]);
};
