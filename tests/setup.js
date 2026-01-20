import { jest } from '@jest/globals';
/**
 * Setup per als tests
 */

// Mock del DOM per tests de Node.js
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.window = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  URL: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock de fetch
global.fetch = jest.fn();

// Mock de File API
global.File = class File {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.size = bits.length;
    this.type = options.type || 'application/octet-stream';
  }
};

global.FileList = class FileList {
  constructor(files = []) {
    this.length = files.length;
    files.forEach((file, index) => {
      this[index] = file;
    });
  }
};

// Mock de Blob
global.Blob = class Blob {
  constructor(content, options = {}) {
    this.size = content.length;
    this.type = options.type || 'application/octet-stream';
  }
}; 