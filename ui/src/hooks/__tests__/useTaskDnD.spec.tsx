import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { useTaskDnD } from '../useTaskDnD';
import type { Task } from '../../components/tasks/types';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

// Sensors are hardware-detection wrappers; only the event handlers matter in unit tests.
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn((...sensors: unknown[]) => sensors),
  };
});

const makeTask = (id: string, status: Task['status'] = 'backlog'): Task => ({
  id,
  status,
  code: `#TASK-${id.toUpperCase()}`,
  title: `Task ${id}`,
  agent: { name: 'Test Agent' },
  priority: 2,
});

// Wraps useTaskDnD with real useState so the tasks prop stays current across
// multi-step drag flows (handleDragOver mutates via setTasks, then handleDragEnd reads tasks).
function useDnDWithState(
  initialTasks: Task[],
  onStatusChange: (id: string, status: string) => Promise<void>,
  skipArchiveConfirm = false,
) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const hook = useTaskDnD({ tasks, setTasks, onStatusChange, skipArchiveConfirm });
  return { ...hook, tasks };
}

describe('useTaskDnD', () => {
  const onStatusChange = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── handleDragStart ────────────────────────────────────────────────────────

  describe('handleDragStart', () => {
    it('sets activeId to the dragged task id', () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a')], onStatusChange),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
      });

      expect(result.current.activeId).toBe('a');
    });

    it('does not throw when the task id is not found in the list', () => {
      const { result } = renderHook(() =>
        useDnDWithState([], onStatusChange),
      );

      expect(() =>
        act(() => {
          result.current.handleDragStart({ active: { id: 'missing' } } as unknown as DragStartEvent);
        }),
      ).not.toThrow();
    });
  });

  // ─── handleDragOver ─────────────────────────────────────────────────────────

  describe('handleDragOver', () => {
    it('does nothing when over is null', () => {
      const tasks = [makeTask('a', 'backlog')];
      const { result } = renderHook(() =>
        useDnDWithState(tasks, onStatusChange),
      );

      act(() => {
        result.current.handleDragOver({ active: { id: 'a' }, over: null } as unknown as DragOverEvent);
      });

      expect(result.current.tasks[0].status).toBe('backlog');
    });

    it('does nothing when dragging over the same item', () => {
      const tasks = [makeTask('a', 'backlog')];
      const { result } = renderHook(() =>
        useDnDWithState(tasks, onStatusChange),
      );

      act(() => {
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'a' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks[0].status).toBe('backlog');
    });

    it('updates task status when dragged over a board column id', () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'in-progress' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks.find((t) => t.id === 'a')?.status).toBe('in-progress');
    });

    it('sets isActive=true when moved to in-progress column', () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'in-progress' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks.find((t) => t.id === 'a')?.isActive).toBe(true);
    });

    it('sets isActive=false when moved away from in-progress', () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'in-progress')], onStatusChange),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'review' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks.find((t) => t.id === 'a')?.isActive).toBe(false);
    });

    it('updates status when dragged over a task that is in a different column', () => {
      const { result } = renderHook(() =>
        useDnDWithState(
          [makeTask('a', 'backlog'), makeTask('b', 'in-progress')],
          onStatusChange,
        ),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'b' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks.find((t) => t.id === 'a')?.status).toBe('in-progress');
    });

    it('does not change status when dragged over a task in the same column', () => {
      const { result } = renderHook(() =>
        useDnDWithState(
          [makeTask('a', 'backlog'), makeTask('b', 'backlog')],
          onStatusChange,
        ),
      );

      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'b' } } as unknown as DragOverEvent);
      });

      expect(result.current.tasks.find((t) => t.id === 'a')?.status).toBe('backlog');
    });
  });

  // ─── handleDragEnd ──────────────────────────────────────────────────────────

  describe('handleDragEnd', () => {
    it('clears activeId regardless of outcome', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      await act(async () => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'backlog' },
        } as unknown as DragEndEvent);
      });

      expect(result.current.activeId).toBeNull();
    });

    it('does nothing when over is null', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      await act(async () => {
        await result.current.handleDragEnd({ active: { id: 'a' }, over: null } as unknown as DragEndEvent);
      });

      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('calls onStatusChange when task is dropped on a different column', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      await act(async () => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        result.current.handleDragOver({ active: { id: 'a' }, over: { id: 'done' } } as unknown as DragOverEvent);
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'done' },
        } as unknown as DragEndEvent);
      });

      expect(onStatusChange).toHaveBeenCalledWith('a', 'done');
    });

    it('does NOT call onStatusChange when dropped back on the same column', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange),
      );

      // Flush the handleDragStart state update (initialStatus) before handleDragEnd reads it.
      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
      });

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'backlog' },
        } as unknown as DragEndEvent);
      });

      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('reorders within the same column without calling onStatusChange', async () => {
      const { result } = renderHook(() =>
        useDnDWithState(
          [makeTask('a', 'backlog'), makeTask('b', 'backlog')],
          onStatusChange,
        ),
      );

      // Flush handleDragStart state update before handleDragEnd reads initialStatus.
      act(() => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
      });

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'b' },
        } as unknown as DragEndEvent);
      });

      expect(onStatusChange).not.toHaveBeenCalled();
      expect(result.current.tasks.map((t) => t.id)).toEqual(['b', 'a']);
    });

    it('archives directly when skipArchiveConfirm=true', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange, true),
      );

      await act(async () => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'archive' },
        } as unknown as DragEndEvent);
      });

      expect(onStatusChange).toHaveBeenCalledWith('a', 'archived');
      expect(result.current.isConfirmOpen).toBe(false);
    });

    it('opens confirm dialog instead of archiving when skipArchiveConfirm=false', async () => {
      const { result } = renderHook(() =>
        useDnDWithState([makeTask('a', 'backlog')], onStatusChange, false),
      );

      await act(async () => {
        result.current.handleDragStart({ active: { id: 'a' } } as unknown as DragStartEvent);
        await result.current.handleDragEnd({
          active: { id: 'a' },
          over: { id: 'archive' },
        } as unknown as DragEndEvent);
      });

      expect(onStatusChange).not.toHaveBeenCalled();
      expect(result.current.isConfirmOpen).toBe(true);
      expect(result.current.pendingArchiveId).toBe('a');
    });
  });
});
