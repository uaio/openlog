import type { Persistence } from './persistence.js';

export interface PerfScoreItem {
  name: string;
  score: number;
  weight: number;
  value: number | null;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
}

export interface PerfRunScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: PerfScoreItem[];
  issues: string[];
  summary: string;
}

export interface PerfRunSession {
  sessionId: string;
  deviceId: string;
  tabId: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshot: any;
  score: PerfRunScore;
  audit?: any;
}

export class PerfRunStore {
  private sessions: Map<string, PerfRunSession[]> = new Map();
  private db?: Persistence;

  constructor(db?: Persistence) {
    this.db = db;
  }

  add(session: PerfRunSession): void {
    const existing = this.sessions.get(session.deviceId) ?? [];
    existing.push(session);
    this.sessions.set(session.deviceId, existing);

    this.db?.insertPerfSession({
      sessionId: session.sessionId,
      deviceId: session.deviceId,
      tabId: session.tabId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      snapshot: session.snapshot,
      score: session.score,
    });
  }

  getAll(deviceId: string): PerfRunSession[] {
    let sessions = this.sessions.get(deviceId);

    // Load from persistence if memory empty
    if ((!sessions || sessions.length === 0) && this.db) {
      const loaded = this.db.loadPerfSessions(deviceId);
      sessions = loaded.map((s) => ({
        sessionId: s.sessionId,
        deviceId: s.deviceId,
        tabId: s.tabId,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        snapshot: s.snapshot,
        score: s.score as PerfRunScore,
      }));
      if (sessions.length > 0) {
        this.sessions.set(deviceId, sessions);
      }
    }

    return sessions ?? [];
  }

  get(deviceId: string, sessionId: string): PerfRunSession | undefined {
    return this.getAll(deviceId).find((s) => s.sessionId === sessionId);
  }

  clear(deviceId: string): void {
    this.sessions.delete(deviceId);
  }
}
