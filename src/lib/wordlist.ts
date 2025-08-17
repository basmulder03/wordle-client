// src/lib/wordlist.ts
export type LetterState = 'correct' | 'present' | 'absent' | 'empty'
export type EvalResult = { states: LetterState[] }

export type ManifestV2 = {
    version?: number
    generatedAt?: string
    sources?: Array<{ lang: string; url: string }>
    lengthsByLang?: Record<string, number[]>
    files?: Record<string, { solutions: Record<string, number>, guesses: Record<string, number> }>
    // legacy:
    counts?: Record<string, number>
    license?: string
}

// Adjust BASE resolution to be safe in non-Vite (Node test) contexts
const BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.BASE_URL) || '/'

export function localeToPrefix(locale: string): string {
    const l = (locale || '').toLowerCase()
    if (l.startsWith('nl')) return 'nl'
    if (l.startsWith('en')) return 'en'
    return 'nl'
}

export async function loadManifest(): Promise<ManifestV2 | null> {
    try {
        const res = await fetch(`${BASE}wordlists/manifest.json`, {cache: 'no-cache'})
        if (!res.ok) throw new Error(String(res.status))
        return await res.json()
    } catch {
        return null
    }
}

export function getAllowedLengths(locale: string, m: ManifestV2 | null): number[] {
    const prefix = localeToPrefix(locale)
    if (!m) return [4, 5, 6, 7]

    // Prefer v2 metadata; fall back to legacy counts keys
    const fromV2 = m.lengthsByLang?.[prefix]
    if (fromV2?.length) return [...new Set(fromV2)].sort((a, b) => a - b)

    // Accept both old (prefix_len.txt) and new (prefix_len_solutions.txt / _guesses) naming
    const re = new RegExp(`^${prefix}_(\\d+)(?:_(?:guesses|solutions))?\\.txt$`)
    const set = new Set<number>()
    for (const k of Object.keys(m.counts || {})) {
        const match = k.match(re);
        if (match) set.add(parseInt(match[1], 10))
    }
    const arr = Array.from(set).sort((a, b) => a - b)
    return arr.length ? arr : [4, 5, 6, 7]
}

export function filenameFor(locale: string, length: number, kind: 'solutions' | 'guesses' = 'solutions'): string {
    const prefix = localeToPrefix(locale)
    return kind === 'solutions'
        ? `${prefix}_${length}_solutions.txt`
        : `${prefix}_${length}_guesses.txt`
}

export async function loadWordlist(locale: string, length: number, kind: 'solutions' | 'guesses' = 'solutions'): Promise<string[]> {
    const file = filenameFor(locale, length, kind)
    let url = `${BASE}wordlists/${file}`
    let res = await fetch(url, {cache: 'no-cache'})

    // Backward compatibility: try old solutions filename without _solutions suffix
    if (!res.ok && kind === 'solutions') {
        const legacy = `${localeToPrefix(locale)}_${length}.txt`
        const legacyUrl = `${BASE}wordlists/${legacy}`
        const legacyRes = await fetch(legacyUrl, {cache: 'no-cache'})
        if (legacyRes.ok) {
            res = legacyRes
            url = legacyUrl
        }
    }

    if (!res.ok) {
        // graceful fallback: if guesses missing, use solutions
        if (kind === 'guesses') return loadWordlist(locale, length, 'solutions')
        throw new Error(`Failed to load ${url}: ${res.status}`)
    }
    const text = await res.text()
    return text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(Boolean)
}

export async function pickDailyWord(locale: string, length: number): Promise<string> {
    const list = await loadWordlist(locale, length, 'solutions')
    const day = new Date().toISOString().slice(0, 10)
    const seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0)
    return list[seed % list.length]
}

export function evaluateGuess(guess: string, answer: string): EvalResult {
    // Defensive: normalize to lower-case (wordlists already are)
    const g = guess.toLowerCase().split('')
    const a = answer.toLowerCase().split('')
    const len = g.length
    const states: LetterState[] = Array(len).fill('absent')

    // Build frequency map of answer letters
    const freq: Record<string, number> = {}
    for (let i = 0; i < len; i++) {
        const ch = a[i]
        freq[ch] = (freq[ch] || 0) + 1
    }

    // First pass: mark correct letters and decrement freq
    for (let i = 0; i < len; i++) {
        if (g[i] === a[i]) {
            states[i] = 'correct'
            freq[g[i]]!--
        }
    }

    // Second pass: mark present (only if remaining freq > 0)
    for (let i = 0; i < len; i++) {
        if (states[i] === 'correct') continue
        const ch = g[i]
        if (freq[ch] > 0) {
            states[i] = 'present'
            freq[ch]!--
        }
    }

    return {states}
}

export function currentWordlistUrl(locale: string, length: number, kind: 'solutions' | 'guesses' = 'solutions'): string {
    return `${BASE}wordlists/${filenameFor(locale, length, kind)}`
}

export async function pickRandomWord(locale: string, length: number): Promise<string> {
    const list = await loadWordlist(locale, length, 'solutions')
    const idx = Math.floor(Math.random() * list.length)
    return list[idx]
}
