export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 0 | 1 | 2 | 3; // CRITICAL, HIGH, MEDIUM, LOW

export interface Agent {
  name: string;
  avatar: string;
  colorClass?: string;
}

export interface Task {
  id: string;
  status: TaskStatus;
  code: string;
  title: string;
  priority?: TaskPriority;
  agent: Agent;
  timeLabel?: string;
  timeIcon?: 'schedule' | 'attach_file' | 'comment'; // Used to map to Lucide icons
  timeValue?: string | number;
  progress?: number;
  isActive?: boolean;
  awaitingReview?: boolean;
  projectId?: string;
  updatedAt?: string;
}
