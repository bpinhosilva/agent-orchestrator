export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';

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
}
