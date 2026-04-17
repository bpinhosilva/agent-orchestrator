// vi.hoisted ensures mock fns are defined before vi.mock factories run (which are hoisted).
const { mockPost, mockCall, useInterceptor, ejectInterceptor } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockCall: vi.fn(),
  useInterceptor: vi.fn().mockReturnValue(1),
  ejectInterceptor: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() =>
      Object.assign(mockCall, {
        post: mockPost,
        interceptors: {
          response: { use: useInterceptor, eject: ejectInterceptor },
        },
        defaults: { headers: { common: {} } },
      }),
    ),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupInterceptors, setUnauthorizedHandler } from '../client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeAxiosError = (
  status: number,
  overrides: {
    url?: string;
    _retry?: boolean;
    skipAuthRefresh?: boolean;
    message?: string | string[];
    errorTitle?: string;
    statusText?: string;
  } = {},
) => ({
  isAxiosError: true,
  message: 'Request failed',
  config: {
    url: overrides.url ?? '/some/endpoint',
    _retry: overrides._retry,
    skipAuthRefresh: overrides.skipAuthRefresh,
  },
  response: {
    status,
    statusText: overrides.statusText ?? 'Error',
    data: {
      message: overrides.message,
      error: overrides.errorTitle,
    },
  },
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('API client interceptors', () => {
  const mockNotifyError = vi.fn();
  let rejectHandler: (error: unknown) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    // mockReturnValue survives clearAllMocks — restore the interceptor id return value.
    useInterceptor.mockReturnValue(1);

    setUnauthorizedHandler(null);
    setupInterceptors(mockNotifyError);

    // The second argument of interceptors.response.use(...) is the reject handler.
    rejectHandler = useInterceptor.mock.calls.at(-1)![1];
  });

  // ─── Repeated setupInterceptors calls ──────────────────────────────────────

  it('ejects the previous interceptor before installing a new one', () => {
    setupInterceptors(mockNotifyError); // second call

    expect(ejectInterceptor).toHaveBeenCalledWith(1);
    expect(useInterceptor).toHaveBeenCalledTimes(2);
  });

  // ─── Non-401 errors ────────────────────────────────────────────────────────

  it('calls notifyError with title and message from response body', async () => {
    const error = makeAxiosError(500, {
      errorTitle: 'Internal Server Error',
      message: 'Something went wrong',
    });

    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockNotifyError).toHaveBeenCalledWith(
      'Internal Server Error',
      'Something went wrong',
    );
  });

  it('joins array messages into a single string', async () => {
    const error = makeAxiosError(422, {
      message: ['Field A is required', 'Field B is invalid'],
    });

    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockNotifyError).toHaveBeenCalledWith(
      expect.any(String),
      'Field A is required. Field B is invalid',
    );
  });

  it('falls back to statusText for the title when error field is absent', async () => {
    const error = makeAxiosError(400, { statusText: 'Bad Request' });

    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockNotifyError).toHaveBeenCalledWith('Bad Request', expect.any(String));
  });

  it('falls back to the axios message string when response body has no message', async () => {
    const error = {
      ...makeAxiosError(503),
      message: 'Network Error',
      response: { status: 503, statusText: 'Service Unavailable', data: {} },
    };

    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockNotifyError).toHaveBeenCalledWith(expect.any(String), 'Network Error');
  });

  // ─── 401 + token refresh ───────────────────────────────────────────────────

  it('attempts a token refresh and retries the original request on 401', async () => {
    mockPost.mockResolvedValueOnce({}); // refreshSession resolves
    mockCall.mockResolvedValueOnce({ data: 'retried response' }); // retry resolves

    const error = makeAxiosError(401);
    const result = await rejectHandler(error);

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/refresh',
      undefined,
      expect.objectContaining({ skipAuthRefresh: true }),
    );
    expect(mockCall).toHaveBeenCalledWith(error.config);
    expect(result).toEqual({ data: 'retried response' });
  });

  it('calls unauthorizedHandler and rejects when refresh fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('refresh failed'));
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(rejectHandler(makeAxiosError(401))).rejects.toBeDefined();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls unauthorizedHandler on a 401 that already has _retry=true', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const error = makeAxiosError(401, { _retry: true });

    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled(); // no refresh attempt
  });

  it('skips refresh for requests to /auth/refresh', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const error = makeAxiosError(401, { url: '/auth/refresh' });
    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockPost).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('skips refresh for requests to /auth/login', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const error = makeAxiosError(401, { url: '/auth/login' });
    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('skips refresh when skipAuthRefresh is true on the config', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const error = makeAxiosError(401, { skipAuthRefresh: true });
    await expect(rejectHandler(error)).rejects.toBeDefined();

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent 401s so only one refresh request is made', async () => {
    let resolveRefresh!: () => void;
    const pendingRefresh = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    mockPost.mockReturnValue(pendingRefresh);
    mockCall.mockResolvedValue({ data: 'ok' });

    const p1 = rejectHandler(makeAxiosError(401));
    const p2 = rejectHandler(makeAxiosError(401));

    resolveRefresh();
    await Promise.all([p1, p2]);

    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
