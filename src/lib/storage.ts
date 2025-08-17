import type {GameMode} from "../types/game.ts";

export type Prefs = {
    language?: string;        // e.g., 'nl-NL' | 'en-US'
    wordLength: number;       // last chosen length
    theme?: 'light' | 'dark' | 'auto';
    sfx?: boolean;
};

export type ModeStats = {
    gamesPlayed: number;
    wins: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution?: number[];
}

export type Stats = Record<GameMode, ModeStats>;

export type DailyProgress = {
    answerHash: string; // hash/fingerprint to detect mismatches
    guesses: string[];  // submitted guesses
    board: { ch: string; state: string }[][];
    keyboard: Record<string, string>;
    startedAt?: number; // epoch ms when this daily game started
    finishedAt?: number; // epoch ms when completed
};

export type FreeplayProgress = {
    answer: string;
    guesses: string[];
    board: { ch: string; state: string }[][];
    keyboard: Record<string, string>;
    startedAt?: number;
    finishedAt?: number;
}

// -------------------------------
// Keys
// -------------------------------
const PREFS_KEY = 'prefs';
const STATS_KEY = 'stats';
const DAILY_KEY_PREFIX = 'daily:';
const FREEPLAY_KEY_PREFIX = 'freeplay:';

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
    return getJSON<Prefs>(PREFS_KEY, {wordLength: 5, language: 'nl-NL', theme: 'auto', sfx: true});
}

export function setPrefs(p: Prefs) {
    setJSON(PREFS_KEY, p);
}

// -------------------------------
// Stats
// -------------------------------
function emptyModeStats(): ModeStats {
    return {gamesPlayed: 0, wins: 0, currentStreak: 0, maxStreak: 0, guessDistribution: [0, 0, 0, 0, 0, 0]}
}

export function getStats(): Stats {
    const raw = getJSON<Stats | null>(STATS_KEY, null);
    if (raw) return raw;
    return {daily: emptyModeStats(), freeplay: emptyModeStats()};
}

export function setStats(stats: Stats) {
    setJSON(STATS_KEY, stats);
}

// ---------------- Daily Progress (per lang + len) ----------------
export function getToday(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export function dailyKeyFor(dayISO: string, language: string, wordLength: number): string {
    return `${DAILY_KEY_PREFIX}${dayISO}:${language}:${wordLength}`
}

export function getDailyProgress(dayISO: string, language: string, wordLength: number): DailyProgress | null {
    const scopedKey = dailyKeyFor(dayISO, language, wordLength)
    const scoped = getJSON<DailyProgress | null>(scopedKey, null)
    if (scoped) return scoped
    return null
}

export function setDailyProgress(dayISO: string, language: string, wordLength: number, p: DailyProgress) {
    setJSON(dailyKeyFor(dayISO, language, wordLength), p)
}

// ---------------- Freeplay Progress (per lang + len) ----------------
function freeplayKey(language: string, wordLength: number): string {
    return `${FREEPLAY_KEY_PREFIX}${language}:${wordLength}`
}

export function getFreeplayProgress(language: string, wordLength: number): FreeplayProgress | null {
    return getJSON<FreeplayProgress | null>(freeplayKey(language, wordLength), null)
}

export function setFreeplayProgress(language: string, wordLength: number, p: FreeplayProgress) {
    setJSON(freeplayKey(language, wordLength), p)
}

export function clearFreeplayProgress(language: string, wordLength: number) {
    try {
        localStorage.removeItem(freeplayKey(language, wordLength))
    } catch {
    }
}