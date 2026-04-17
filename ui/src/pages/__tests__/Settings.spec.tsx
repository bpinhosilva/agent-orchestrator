import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';
import * as systemSettingsApi from '../../api/system-settings';
import { useNotification } from '../../hooks/useNotification';

vi.mock('../../api/system-settings', () => ({
  getSystemSettings: vi.fn(),
  updateSystemSettings: vi.fn(),
}));

vi.mock('../../hooks/useNotification', () => ({
  useNotification: vi.fn(),
}));

const defaultSettings: systemSettingsApi.SystemSettings = {
  id: 'settings-1',
  data: {
    taskScheduler: {
      pollIntervalInMs: 20000,
      maxTaskPerExecution: 5,
    },
    recurrentTasksScheduler: {
      pollIntervalInMs: 15000,
      executionTimeout: 120000,
      maxActiveTasks: 5,
    },
  },
};

const mockNotification = {
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
  notifyApiError: vi.fn(),
  closeNotification: vi.fn(),
  state: { isOpen: false, type: 'info' as const, title: '', message: '' },
};

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotification).mockReturnValue(mockNotification);
    vi.mocked(systemSettingsApi.getSystemSettings).mockResolvedValue(defaultSettings);
    vi.mocked(systemSettingsApi.updateSystemSettings).mockResolvedValue(defaultSettings);
  });

  it('shows a loading spinner while fetching', () => {
    vi.mocked(systemSettingsApi.getSystemSettings).mockReturnValue(new Promise(() => {}));
    render(<Settings />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders the taskScheduler section after loading', async () => {
    render(<Settings />);
    expect(await screen.findByText(/TASK_SCHEDULER/i)).toBeInTheDocument();
  });

  it('renders the recurrentTasksScheduler section after loading', async () => {
    render(<Settings />);
    expect(await screen.findByText(/RECURRENT_TASKS_SCHEDULER/i)).toBeInTheDocument();
  });

  it('displays current taskScheduler pollIntervalInMs value', async () => {
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);
    const inputs = screen.getAllByRole('spinbutton');
    const pollInput = inputs.find((el) => (el as HTMLInputElement).value === '20000');
    expect(pollInput).toBeDefined();
  });

  it('displays current taskScheduler maxTaskPerExecution value', async () => {
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);
    const inputs = screen.getAllByRole('spinbutton');
    const maxInput = inputs.find((el) => (el as HTMLInputElement).value === '5');
    expect(maxInput).toBeDefined();
  });

  it('displays current recurrentTasksScheduler pollIntervalInMs value', async () => {
    render(<Settings />);
    await screen.findByText(/RECURRENT_TASKS_SCHEDULER/i);
    const inputs = screen.getAllByRole('spinbutton');
    const pollInput = inputs.find((el) => (el as HTMLInputElement).value === '15000');
    expect(pollInput).toBeDefined();
  });

  it('displays current recurrentTasksScheduler executionTimeout value', async () => {
    render(<Settings />);
    await screen.findByText(/RECURRENT_TASKS_SCHEDULER/i);
    const inputs = screen.getAllByRole('spinbutton');
    const timeoutInput = inputs.find((el) => (el as HTMLInputElement).value === '120000');
    expect(timeoutInput).toBeDefined();
  });

  it('displays current recurrentTasksScheduler maxActiveTasks value', async () => {
    render(<Settings />);
    await screen.findByText(/RECURRENT_TASKS_SCHEDULER/i);
    const inputs = screen.getAllByRole('spinbutton');
    const maxInput = inputs.find((el) => (el as HTMLInputElement).value === '5');
    expect(maxInput).toBeDefined();
  });

  it('calls updateSystemSettings with current settings when COMMIT is clicked', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);

    await user.click(screen.getByText(/COMMIT/i));

    await waitFor(() => {
      expect(systemSettingsApi.updateSystemSettings).toHaveBeenCalledWith(defaultSettings);
    });
  });

  it('notifies success after a successful save', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);

    await user.click(screen.getByText(/COMMIT/i));

    await waitFor(() => {
      expect(mockNotification.notifySuccess).toHaveBeenCalled();
    });
  });

  it('notifies error when save fails', async () => {
    vi.mocked(systemSettingsApi.updateSystemSettings).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);

    await user.click(screen.getByText(/COMMIT/i));

    await waitFor(() => {
      expect(mockNotification.notifyApiError).toHaveBeenCalled();
    });
  });

  it('reloads settings when ABORT is clicked', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await screen.findByText(/TASK_SCHEDULER/i);

    await user.click(screen.getByText(/ABORT/i));

    await waitFor(() => {
      expect(systemSettingsApi.getSystemSettings).toHaveBeenCalledTimes(2);
    });
  });

  it('notifies error when fetch fails', async () => {
    vi.mocked(systemSettingsApi.getSystemSettings).mockRejectedValue(new Error('network'));
    render(<Settings />);

    await waitFor(() => {
      expect(mockNotification.notifyApiError).toHaveBeenCalled();
    });
  });
});
