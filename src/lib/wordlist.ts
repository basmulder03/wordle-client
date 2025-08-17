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

const BASE = import.meta.env.BASE_URL || '/'

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

    const re = new RegExp(`^${prefix}_(\\d+)(?:_guesses)?\\.txt$`)
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
        ? `${prefix}_${length}.txt`
        : `${prefix}_${length}_guesses.txt`
}

export async function loadWordlist(locale: string, length: number, kind: 'solutions' | 'guesses' = 'solutions'): Promise<string[]> {
    const file = filenameFor(locale, length, kind)
    const url = `${BASE}wordlists/${file}`
    const res = await fetch(url, {cache: 'no-cache'})
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
    const g = guess.split(''), a = answer.split('')
    const states: LetterState[] = Array(g.length).fill('absent')
    const used: boolean[] = Array(a.length).fill(false)
    g.forEach((ch, i) => {
        if (ch === a[i]) {
            states[i] = 'correct';
            used[i] = true
        }
    })
    g.forEach((ch, i) => {
        if (states[i] === 'correct') return
        const idx = a.findIndex((ach, j) => !used[j] && ach === ch)
        if (idx !== -1) {
            states[i] = 'present';
            used[idx] = true
        }
    })
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
