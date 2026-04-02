import { useState, useCallback } from 'react';
import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { Task } from '../components/tasks/types';

interface UseTaskDnDOptions {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  skipArchiveConfirm: boolean;
}

export function useTaskDnD({ tasks, setTasks, onStatusChange, skipArchiveConfirm }: UseTaskDnDOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<Task['status'] | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const task = tasks.find(t => t.id === id);
    if (task) setInitialStatus(task.status);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dragActiveId = active.id;
    const overId = over.id;
    if (dragActiveId === overId) return;

    const activeIndex = tasks.findIndex(t => t.id === dragActiveId);
    const overIndex = tasks.findIndex(t => t.id === overId);
    if (activeIndex === -1) return;

    const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';

    if (!isOverColumn && overIndex >= 0) {
      if (tasks[activeIndex].status !== tasks[overIndex].status) {
        const newItems = [...tasks];
        const newStatus = tasks[overIndex].status;
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          status: newStatus,
          isActive: newStatus === 'in-progress',
        };
        setTasks(arrayMove(newItems, activeIndex, overIndex));
      }
    } else if (isOverColumn) {
      if (tasks[activeIndex].status !== overId) {
        const newItems = [...tasks];
        const newStatus = overId as Task['status'];
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          status: newStatus,
          isActive: newStatus === 'in-progress',
        };
        setTasks(arrayMove(newItems, activeIndex, tasks.length - 1));
      }
    }
  }, [tasks, setTasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dragActiveId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === dragActiveId);
    if (!activeTask) return;

    if (overId === 'archive') {
      if (skipArchiveConfirm) {
        await onStatusChange(dragActiveId, 'archived');
      } else {
        setPendingArchiveId(dragActiveId);
        setIsConfirmOpen(true);
      }
      setInitialStatus(null);
      return;
    }

    const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';
    const newStatus = isOverColumn ? (overId as Task['status']) : tasks.find(t => t.id === overId)?.status;

    if (newStatus && initialStatus !== newStatus) {
      await onStatusChange(dragActiveId, newStatus);
    }

    setInitialStatus(null);
    if (dragActiveId === overId) return;

    const activeIndex = tasks.findIndex(t => t.id === dragActiveId);
    const overIndex = tasks.findIndex(t => t.id === overId);
    if (activeIndex === -1) return;

    const isOverColumnCheck = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';
    if (!isOverColumnCheck && overIndex >= 0) {
      if (tasks[activeIndex].status === tasks[overIndex].status) {
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }
  }, [tasks, setTasks, initialStatus, skipArchiveConfirm, onStatusChange]);

  return {
    activeId,
    sensors,
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isConfirmOpen,
    setIsConfirmOpen,
    pendingArchiveId,
    setPendingArchiveId,
  };
}
