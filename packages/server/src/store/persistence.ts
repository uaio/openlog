import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

export interface PersistenceOptions {
  dbPath?: string;
  retentionDays?: number;
}

const DEFAULT_DB_DIR = join(homedir(), '.openlog');
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, 'data.db');
const DEFAULT_RETENTION_DAYS = 7;

export class Persistence {
  private db: Database.Database;
  private retentionDays: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: PersistenceOptions = {}) {
    const dbPath = options.dbPath || DEFAULT_DB_PATH;
    this.retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;

    // Ensure directory exists
    mkdirSync(dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.initSchema();
    this.cleanup();

    // Run cleanup every hour
    this.cleanupTimer = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        ua TEXT NOT NULL,
        screen TEXT NOT NULL DEFAULT '',
        pixel_ratio REAL NOT NULL DEFAULT 1,
        language TEXT NOT NULL DEFAULT '',
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        tab_id TEXT NOT NULL DEFAULT '',
        timestamp INTEGER NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        stack TEXT
      );

      CREATE TABLE IF NOT EXISTS network_requests (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        tab_id TEXT NOT NULL DEFAULT '',
        timestamp INTEGER NOT NULL,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        status INTEGER,
        status_text TEXT,
        request_headers TEXT,
        request_body TEXT,
        response_headers TEXT,
        response_body TEXT,
        duration INTEGER,
        type TEXT NOT NULL DEFAULT 'xhr',
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS perf_sessions (
        session_id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        tab_id TEXT NOT NULL DEFAULT '',
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        snapshot_json TEXT,
        score_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_logs_device_ts ON logs(device_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_network_device_ts ON network_requests(device_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_network_timestamp ON network_requests(timestamp);
      CREATE INDEX IF NOT EXISTS idx_perf_device ON perf_sessions(device_id);
      CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);
    `);
  }

  /** Remove data older than retentionDays */
  cleanup(): void {
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    this.db.prepare('DELETE FROM logs WHERE timestamp < ?').run(cutoff);
    this.db.prepare('DELETE FROM network_requests WHERE timestamp < ?').run(cutoff);
    this.db.prepare('DELETE FROM perf_sessions WHERE end_time < ?').run(cutoff);
    this.db.prepare('DELETE FROM devices WHERE last_seen < ?').run(cutoff);
  }

  // ─── Devices ───────────────────────────────────────────

  upsertDevice(device: {
    deviceId: string;
    projectId: string;
    ua: string;
    screen: string;
    pixelRatio: number;
    language: string;
  }): void {
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO devices (device_id, project_id, ua, screen, pixel_ratio, language, first_seen, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(device_id) DO UPDATE SET
           project_id = excluded.project_id,
           ua = excluded.ua,
           screen = excluded.screen,
           pixel_ratio = excluded.pixel_ratio,
           language = excluded.language,
           last_seen = excluded.last_seen`,
      )
      .run(
        device.deviceId,
        device.projectId,
        device.ua,
        device.screen,
        device.pixelRatio,
        device.language,
        now,
        now,
      );
  }

  touchDevice(deviceId: string): void {
    this.db.prepare('UPDATE devices SET last_seen = ? WHERE device_id = ?').run(Date.now(), deviceId);
  }

  loadDevices(): Array<{
    deviceId: string;
    projectId: string;
    ua: string;
    screen: string;
    pixelRatio: number;
    language: string;
    firstSeen: number;
    lastSeen: number;
  }> {
    const rows = this.db
      .prepare('SELECT * FROM devices ORDER BY last_seen DESC')
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      deviceId: r.device_id as string,
      projectId: r.project_id as string,
      ua: r.ua as string,
      screen: r.screen as string,
      pixelRatio: r.pixel_ratio as number,
      language: r.language as string,
      firstSeen: r.first_seen as number,
      lastSeen: r.last_seen as number,
    }));
  }

  // ─── Logs ──────────────────────────────────────────────

  private insertLogStmt: Database.Statement | null = null;

  insertLog(log: {
    deviceId: string;
    tabId: string;
    timestamp: number;
    level: string;
    message: string;
    stack?: string;
  }): void {
    if (!this.insertLogStmt) {
      this.insertLogStmt = this.db.prepare(
        'INSERT INTO logs (device_id, tab_id, timestamp, level, message, stack) VALUES (?, ?, ?, ?, ?, ?)',
      );
    }
    this.insertLogStmt.run(log.deviceId, log.tabId, log.timestamp, log.level, log.message, log.stack || null);
  }

  insertLogsBatch(
    logs: Array<{
      deviceId: string;
      tabId: string;
      timestamp: number;
      level: string;
      message: string;
      stack?: string;
    }>,
  ): void {
    if (logs.length === 0) return;
    const insert = this.db.prepare(
      'INSERT INTO logs (device_id, tab_id, timestamp, level, message, stack) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const batch = this.db.transaction((items: typeof logs) => {
      for (const log of items) {
        insert.run(log.deviceId, log.tabId, log.timestamp, log.level, log.message, log.stack || null);
      }
    });
    batch(logs);
  }

  loadLogs(deviceId: string, limit: number = 200): Array<{
    deviceId: string;
    tabId: string;
    timestamp: number;
    level: string;
    message: string;
    stack?: string;
  }> {
    const rows = this.db
      .prepare('SELECT * FROM logs WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?')
      .all(deviceId, limit) as Array<Record<string, unknown>>;
    return rows
      .map((r) => ({
        deviceId: r.device_id as string,
        tabId: r.tab_id as string,
        timestamp: r.timestamp as number,
        level: r.level as string,
        message: r.message as string,
        stack: (r.stack as string) || undefined,
      }))
      .reverse();
  }

  clearLogs(deviceId: string): void {
    this.db.prepare('DELETE FROM logs WHERE device_id = ?').run(deviceId);
  }

  // ─── Network Requests ──────────────────────────────────

  insertNetworkRequest(req: {
    id: string;
    deviceId: string;
    tabId: string;
    timestamp: number;
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: string;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    duration?: number;
    type: string;
    error?: string;
  }): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO network_requests
         (id, device_id, tab_id, timestamp, method, url, status, status_text,
          request_headers, request_body, response_headers, response_body, duration, type, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.id,
        req.deviceId,
        req.tabId,
        req.timestamp,
        req.method,
        req.url,
        req.status ?? null,
        req.statusText ?? null,
        req.requestHeaders ? JSON.stringify(req.requestHeaders) : null,
        req.requestBody ?? null,
        req.responseHeaders ? JSON.stringify(req.responseHeaders) : null,
        req.responseBody ?? null,
        req.duration ?? null,
        req.type,
        req.error ?? null,
      );
  }

  loadNetworkRequests(deviceId: string, limit: number = 100): Array<{
    id: string;
    deviceId: string;
    tabId: string;
    timestamp: number;
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: string;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    duration?: number;
    type: string;
    error?: string;
  }> {
    const rows = this.db
      .prepare('SELECT * FROM network_requests WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?')
      .all(deviceId, limit) as Array<Record<string, unknown>>;
    return rows
      .map((r) => ({
        id: r.id as string,
        deviceId: r.device_id as string,
        tabId: r.tab_id as string,
        timestamp: r.timestamp as number,
        method: r.method as string,
        url: r.url as string,
        status: (r.status as number) || undefined,
        statusText: (r.status_text as string) || undefined,
        requestHeaders: r.request_headers ? JSON.parse(r.request_headers as string) : undefined,
        requestBody: (r.request_body as string) || undefined,
        responseHeaders: r.response_headers ? JSON.parse(r.response_headers as string) : undefined,
        responseBody: (r.response_body as string) || undefined,
        duration: (r.duration as number) || undefined,
        type: r.type as string,
        error: (r.error as string) || undefined,
      }))
      .reverse();
  }

  // ─── Perf Sessions ─────────────────────────────────────

  insertPerfSession(session: {
    sessionId: string;
    deviceId: string;
    tabId: string;
    startTime: number;
    endTime: number;
    duration: number;
    snapshot?: unknown;
    score: unknown;
  }): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO perf_sessions
         (session_id, device_id, tab_id, start_time, end_time, duration, snapshot_json, score_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        session.sessionId,
        session.deviceId,
        session.tabId,
        session.startTime,
        session.endTime,
        session.duration,
        session.snapshot ? JSON.stringify(session.snapshot) : null,
        JSON.stringify(session.score),
      );
  }

  loadPerfSessions(deviceId: string, limit: number = 20): Array<{
    sessionId: string;
    deviceId: string;
    tabId: string;
    startTime: number;
    endTime: number;
    duration: number;
    snapshot: unknown;
    score: unknown;
  }> {
    const rows = this.db
      .prepare('SELECT * FROM perf_sessions WHERE device_id = ? ORDER BY end_time DESC LIMIT ?')
      .all(deviceId, limit) as Array<Record<string, unknown>>;
    return rows
      .map((r) => ({
        sessionId: r.session_id as string,
        deviceId: r.device_id as string,
        tabId: r.tab_id as string,
        startTime: r.start_time as number,
        endTime: r.end_time as number,
        duration: r.duration as number,
        snapshot: r.snapshot_json ? JSON.parse(r.snapshot_json as string) : null,
        score: JSON.parse(r.score_json as string),
      }))
      .reverse();
  }

  // ─── Lifecycle ─────────────────────────────────────────

  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.db.close();
  }
}
