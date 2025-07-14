import '@testing-library/jest-dom';

// Mock image elements
Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
  get: function() {
    return 100;
  },
});

Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
  get: function() {
    return 100;
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas for image thumbnail generation
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock FileReader
const mockFileReader = {
  result: null,
  onload: null,
  readAsDataURL: jest.fn(function(this: any) {
    this.result = 'data:image/jpeg;base64,mock-base64-data';
    if (this.onload) {
      this.onload();
    }
  })
};

(global as any).FileReader = jest.fn(() => mockFileReader);

// Global test configuration
if (typeof window !== 'undefined') {
  // Additional test setup can go here
}