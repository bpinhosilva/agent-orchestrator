import { useEffect, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Task } from '../api/tasks';

export const useTaskSSE = (
  projectId: string | undefined,
  onTaskUpdate: (event: string, task: Task) => void
) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!projectId) return;

    abortControllerRef.current = new AbortController();
    const token = localStorage.getItem('auth_token');

    const connect = async () => {
      try {
        await fetchEventSource(`/api/v1/projects/${projectId}/tasks/events`, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Accept': 'text/event-stream',
          },
          signal: abortControllerRef.current?.signal,
          onmessage(msg) {
            if (!msg.data) return;
            try {
              const data = JSON.parse(msg.data);
              if (data && data.task && data.event) {
                onTaskUpdate(data.event, data.task);
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
            // Optionally we can wait or re-throw, by default returning nothing retries.
          },
        });
      } catch (err) {
        // Will be caught if the request fails before SSE stream starts
        console.error('SSE initialization failed', err);
      }
    };

    connect();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId, onTaskUpdate]);
};
