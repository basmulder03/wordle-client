import type {EvalResult, LetterState} from '../types/game';

export type Manifest = {
    source: string;
    license?: string;
    counts: Record<string, number>;
    generatedAt?: string;
    options?: unknown;
}

const BASE = import.meta.env.BASE_URL || '/';

// Map a locale to the filename prefix you use in wordlist files
// Extend when you add more locales (e.g., "en-US"-> "en")
export function localeToPrefix(locale: string): string {
    if (locale?.toLowerCase().startsWith('nl')) return 'nl';
    if (locale?.toLowerCase().startsWith('en')) return 'en';
    // default fallback
    return 'nl';
}

export async function loadManifest(): Promise<Manifest | null> {
    try {
        const res = await fetch(`${BASE}wordlists/manifest.json`);
        if (!res.ok) {
            console.error(`Failed to load manifest: ${res.status} ${res.statusText}`);
            return null;
        }
        return await res.json()
    } catch {
        return null;
    }
}

/**
 * Returns the allowed length for a given locale,
 * derived from the manifest counts keys like "nl_5.txt".
 */
export function getAllowedLengths(locale: string, m: Manifest | null): number[] {
    const prefix = localeToPrefix(locale);
    if (!m) return [4, 5, 6, 7, 8, 9]; // default lengths if no manifest
    const re = new RegExp(`^${prefix}_(\\d+)\\.txt$`);
    const set = new Set<number>();
    for (const key of Object.keys(m.counts || {})) {
        const match = key.match(re);
        if (match) {
            const length = parseInt(match[1], 10);
            const count = m.counts[key]
            if (Number.isFinite(length) && count > 0) set.add(length);
        }
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length > 0 ? arr : [4, 5, 6, 7, 8, 9]; // fallback if no valid lengths found
}

export function filenameFor(locale: string, length: number): string {
    const prefix = localeToPrefix(locale);
    return `${prefix}_${length}.txt`;
}

export async function loadWordlist(length: number, locale: string): Promise<string[]> {
    const filename = filenameFor(locale, length);
    const url = `${BASE}wordlists/${filename}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Failed to load wordlist for ${locale} length ${length}: ${res.status} ${res.statusText}`);
            return [];
        }
        const text = await res.text();
        return text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    } catch (error) {
        console.error(`Error loading wordlist for ${locale} length ${length}:`, error);
        return [];
    }
}

export async function pickDailyWord(locale: string, length: number): Promise<string> {
    const list = await loadWordlist(length, locale);
    // Deterministic per day seed
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
    return list[seed % list.length];
}

export function evaluateGuess(guess: string, answer: string): EvalResult {
    const g = guess.split(''), a = answer.split('');
    const states: LetterState[] = Array(guess.length).fill('absent');
    const used: boolean[] = Array(answer.length).fill(false);

    // exact matches
    g.forEach((ch, i) => {
        if (ch === a[i]) {
            states[i] = 'correct';
            used[i] = true;
        }
    });
    // present letters
    g.forEach((ch, i) => {
        if (states[i] === 'correct') return; // skip already matched
        const idx = a.findIndex((ach, j) => !used[j] && ach === ch);
        if (idx !== -1) {
            states[i] = 'present';
            used[idx] = true;
        }
    });
    return {states};
}

// Useful for footer/About links when you want to show the current list URL:
export function currentWordlistUrl(locale: string, length: number): string {
    return `${BASE}wordlists/${filenameFor(locale, length)}`;
}