export type Prefs = {
    wordLength: number
}

export type Stats = {
    gamesPlayed: number
    wins: number
    currentStreak: number
    maxStreak: number
}

export type DailyProgress = {
    answerHash: string
    guesses: string[]
    board: { ch: string; state: string }[][]
    keyboard: Record<string, string>
}

const PREFS_KEY = 'prefs';
const STATS_KEY = 'stats';
const DAILY_KEY_PREFIX = 'daily:';

function getJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        console.error(`Failed to parse JSON for key "${key}"`);
        return fallback;
    }
}

function setJSON<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to set JSON for key "${key}":`, e);
    }
}

// Preferences ----------------------------------------------------------------
export function getPrefs(): Prefs {
    return getJSON(PREFS_KEY, {wordLength: 5});
}

export function setPrefs(prefs: Prefs): void {
    setJSON(PREFS_KEY, prefs);
}

// Stats ----------------------------------------------------------------------
export function getStats(): Stats {
    return getJSON(STATS_KEY, {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0
    });
}

export function setStats(stats: Stats): void {
    setJSON(STATS_KEY, stats);
}

// Daily Progress -------------------------------------------------------------

/**
 * Generate a key for today's game progress, independent of word length.
 * If you want length-specific progress, use `getDailyProgress` with the length.
 */
export function getTodayKey(): string {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    return `${DAILY_KEY_PREFIX}${today}`;
}

export function getDailyProgress(key: string): DailyProgress | null {
    return getJSON(key, null);
}

export function setDailyProgress(key: string, progress: DailyProgress): void {
    setJSON(key, progress);
}