// Jest setup file to configure test environment

// Set longer default timeout for all tests
jest.setTimeout(60000);

// Global test cleanup
afterEach(() => {
  // Add any global cleanup here if needed
});

beforeAll(() => {
  // Suppress console.warn in tests to reduce noise
  const originalWarn = console.warn;
  console.warn = (message: string) => {
    if (!message.includes('worker not found')) {
      originalWarn(message);
    }
  };
});