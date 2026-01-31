// src/test/setup.ts
import { vi, beforeEach } from 'vitest';

// Mock localStorage with actual storage behavior
const createLocalStorageMock = () => {
  let store: { [key: string]: string } = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(),
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener for online/offline events
const originalAddEventListener = window.addEventListener;
window.addEventListener = vi.fn().mockImplementation((event, handler, options) => {
  if (event === 'online' || event === 'offline') {
    // Store handlers for potential triggering in tests
    return;
  }
  // For other events, use original implementation
  return originalAddEventListener.call(window, event, handler, options);
});

// Mock crypto for secure random generation
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr: Uint8Array) => {
      // Fill with dummy values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Types for Supabase mock
interface MockSupabaseResult {
  data: unknown;
  error: { code: string; message: string } | null;
}

interface MockQuery {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
}

// Mock Supabase with proper query chaining
const createMockQuery = (
  finalResult: MockSupabaseResult = {
    data: null,
    error: { code: 'MOCK_ERROR', message: 'Mock Supabase error for testing fallback' },
  }
): MockQuery => {
  const mockQuery = {} as MockQuery;

  mockQuery.select = vi.fn().mockReturnValue(mockQuery);
  mockQuery.eq = vi.fn().mockReturnValue(mockQuery);
  mockQuery.order = vi.fn().mockReturnValue(mockQuery);
  mockQuery.single = vi.fn().mockResolvedValue(finalResult);
  mockQuery.insert = vi.fn().mockResolvedValue(finalResult);
  mockQuery.update = vi.fn().mockReturnValue(mockQuery);
  mockQuery.upsert = vi.fn().mockResolvedValue(finalResult);

  return mockQuery;
};

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => createMockQuery()),
  },
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset navigator.onLine to default
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
});
