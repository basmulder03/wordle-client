export type Prefs = {
    language?: string;        // e.g., 'nl-NL' | 'en-US'
    wordLength: number;       // last chosen length
    theme?: 'light' | 'dark';
    sfx?: boolean;
};

export type Stats = {
    gamesPlayed: number;
    wins: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution?: number[]; // optional histogram by attempt
};

export type DailyProgress = {
    answerHash: string; // hash/fingerprint to detect mismatches
    guesses: string[];  // submitted guesses
    board: { ch: string; state: string }[][];
    keyboard: Record<string, string>;
};

// -------------------------------
// Keys
// -------------------------------
const PREFS_KEY = 'prefs';
const STATS_KEY = 'stats';
const DAILY_KEY_PREFIX = 'daily:'; // old style: daily:YYYY-MM-DD
// new style:  daily:YYYY-MM-DD:<lang>:<len>, e.g. daily:2025-08-14:nl-NL:5

// -------------------------------
// JSON utils
// -------------------------------
function getJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function setJSON<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota errors
    }
}

// -------------------------------
// Prefs
// -------------------------------
export function getPrefs(): Prefs {
    return getJSON<Prefs>(PREFS_KEY, {wordLength: 5, language: 'nl-NL', theme: 'light', sfx: true});
}

export function setPrefs(p: Prefs) {
    setJSON(PREFS_KEY, p);
}

// -------------------------------
// Stats
// -------------------------------
export function getStats(): Stats {
    return getJSON<Stats>(STATS_KEY, {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0]
    });
}

export function setStats(s: Stats) {
    setJSON(STATS_KEY, s);
}

// -------------------------------
// Daily Progress (per lang + length)
// -------------------------------

/**
 * Returns today's YYYY-MM-DD string (local time).
 * If you prefer UTC, change to new Date().toISOString().slice(0,10).
 */
export function getToday(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Build the per-day storage key scoped by language and length.
 * Example: daily:2025-08-14:nl-NL:5
 */
export function dailyKeyFor(dayISO: string, language: string, wordLength: number): string {
    return `${DAILY_KEY_PREFIX}${dayISO}:${language}:${wordLength}`;
}

/**
 * Legacy key (pre-scoped) for backward compatibility:
 * daily:YYYY-MM-DD
 */
function legacyDailyKey(dayISO: string): string {
    return `${DAILY_KEY_PREFIX}${dayISO}`;
}

/**
 * Read daily progress for given day/lang/len.
 * If no scoped entry exists but a legacy key does, migrate it on the fly.
 */
export function getDailyProgress(dayISO: string, language: string, wordLength: number): DailyProgress | null {
    const scopedKey = dailyKeyFor(dayISO, language, wordLength);
    const scoped = getJSON<DailyProgress | null>(scopedKey, null);
    if (scoped) return scoped;

    // Backward-compat migration once:
    const legacy = getJSON<DailyProgress | null>(legacyDailyKey(dayISO), null);
    if (legacy) {
        // Save under new scoped key and keep legacy as-is (or remove it—your call).
        setJSON(scopedKey, legacy);
        return legacy;
    }
    return null;
}

export function setDailyProgress(dayISO: string, language: string, wordLength: number, p: DailyProgress) {
    const key = dailyKeyFor(dayISO, language, wordLength);
    setJSON(key, p);
}
