import '@testing-library/jest-dom';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
  uploadData: jest.fn(() => ({
    result: Promise.resolve({ key: 'mock-key' }),
  })),
  downloadData: jest.fn(() => ({
    result: Promise.resolve({ body: new Blob() }),
  })),
}));

// Mock video elements
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
});

// Mock canvas for video thumbnail generation
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillStyle: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
});

HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  const blob = new Blob(['mock video data'], { type: 'video/mp4' });
  callback(blob);
});

// Global test configuration
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock intersection observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings during tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});