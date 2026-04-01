import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDeviceId, generateTabId, getDeviceInfo } from './device.js';

// Mock browser APIs
const mockLocation = {
  origin: 'https://example.com',
  pathname: '/test'
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 Test Browser',
  language: 'en-US'
};

const mockScreen = {
  width: 1920,
  height: 1080
};

// Setup global mocks
vi.stubGlobal('window', {
  location: mockLocation,
  navigator: mockNavigator,
  screen: mockScreen,
  devicePixelRatio: 2
});

vi.stubGlobal('navigator', mockNavigator);
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
});

describe('device', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate consistent device ID for same inputs', () => {
    const projectId = 'test-app';
    const id1 = generateDeviceId(projectId);
    const id2 = generateDeviceId(projectId);
    expect(id1).toBe(id2);
  });

  it('should generate different device IDs for different projects', () => {
    const id1 = generateDeviceId('app1');
    const id2 = generateDeviceId('app2');
    expect(id1).not.toBe(id2);
  });

  it('should generate unique tab IDs', () => {
    const id1 = generateTabId();
    const id2 = generateTabId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^tab-/);
  });

  it('should return correct device info', () => {
    const projectId = 'test-project';
    const info = getDeviceInfo(projectId);

    expect(info.projectId).toBe(projectId);
    expect(info.ua).toBe(mockNavigator.userAgent);
    expect(info.screen).toBe('1920x1080');
    expect(info.pixelRatio).toBe(2);
    expect(info.language).toBe('en-US');
    expect(info.url).toBe('https://example.com/test');
  });
});
