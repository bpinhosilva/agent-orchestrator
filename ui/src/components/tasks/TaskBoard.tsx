import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import TaskColumn from './TaskColumn';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from './types';
import { initialTasks } from './mockData';

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns: { id: TaskStatus; title: string; dot: string; bg: string; text: string }[] = [
    { id: 'backlog', title: 'Backlog', dot: 'bg-outline', bg: 'bg-surface-container-high', text: 'text-outline-variant' },
    { id: 'in-progress', title: 'In-Progress', dot: 'bg-primary animate-pulse', bg: 'bg-primary-container', text: 'text-primary' },
    { id: 'review', title: 'Review', dot: 'bg-tertiary', bg: 'bg-tertiary-container', text: 'text-tertiary' },
    { id: 'done', title: 'Done', dot: 'bg-secondary', bg: 'bg-secondary-container/20', text: 'text-secondary' }
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setTasks((tasks) => {
      const activeIndex = tasks.findIndex(t => t.id === activeId);
      const overIndex = tasks.findIndex(t => t.id === overId);
      
      if (activeIndex === -1) return tasks;

      const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';

      if (!isOverColumn && overIndex >= 0) {
        // Dropping into another task
        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          const newItems = [...tasks];
          const newStatus = tasks[overIndex].status;
          newItems[activeIndex] = { ...newItems[activeIndex], status: newStatus };
          return arrayMove(newItems, activeIndex, overIndex);
        }
      } else if (isOverColumn) {
        // Dropping into an empty column
        if (tasks[activeIndex].status !== overId) {
          const newItems = [...tasks];
          newItems[activeIndex] = { ...newItems[activeIndex], status: overId as TaskStatus };
          return arrayMove(newItems, activeIndex, newItems.length - 1);
        }
      }

      return tasks;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setTasks((tasks) => {
      const activeIndex = tasks.findIndex(t => t.id === activeId);
      const overIndex = tasks.findIndex(t => t.id === overId);
      
      if (activeIndex === -1) return tasks;

      const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';

      if (!isOverColumn && overIndex >= 0) {
        if (tasks[activeIndex].status === tasks[overIndex].status) {
           return arrayMove(tasks, activeIndex, overIndex);
        }
      }

      return tasks;
    });
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map(col => (
          <TaskColumn
            key={col.id}
            id={col.id}
            title={col.title}
            dotColorClass={col.dot}
            badgeBgClass={col.bg}
            badgeTextClass={col.text}
            tasks={tasks.filter(t => t.status === col.id)}
            colorClass=""
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;
