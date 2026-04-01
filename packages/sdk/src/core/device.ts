import type { DeviceInfo } from '../types/index.js';

// 简单的字符串 hash 函数
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// 生成设备 ID
export function generateDeviceId(projectId: string): string {
  const urlPart = window.location.origin + window.location.pathname;
  const ua = navigator.userAgent;
  return hashString(urlPart + ua + projectId);
}

// 生成标签页 ID
export function generateTabId(): string {
  return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

// 获取设备信息
export function getDeviceInfo(projectId: string): DeviceInfo {
  const deviceId = generateDeviceId(projectId);

  const cachedId = localStorage.getItem(`aiconsole_device_id_${projectId}`);
  const isNew = !cachedId || cachedId !== deviceId;

  if (isNew) {
    localStorage.setItem(`aiconsole_device_id_${projectId}`, deviceId);
  }

  return {
    deviceId,
    projectId,
    ua: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    pixelRatio: window.devicePixelRatio,
    language: navigator.language,
    url: window.location.origin + window.location.pathname,
    connectTime: isNew ? Date.now() : parseInt(localStorage.getItem(`aiconsole_connect_time_${projectId}`) || '0'),
    lastActiveTime: Date.now()
  };
}

// 更新设备活跃时间
export function updateDeviceActiveTime(projectId: string): void {
  localStorage.setItem(`aiconsole_last_active_${projectId}`, Date.now().toString());
}
