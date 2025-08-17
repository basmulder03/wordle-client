import {beforeEach, describe, expect, it} from 'vitest'
import {
    clearFreeplayProgress,
    dailyKeyFor,
    getDailyProgress,
    getFreeplayProgress,
    getPrefs,
    getStats,
    getToday,
    setDailyProgress,
    setFreeplayProgress,
    setPrefs,
    setStats
} from './storage'

class MemoryStorage {
    store: Record<string, string> = {}

    getItem(k: string) {
        return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null
    }

    setItem(k: string, v: string) {
        this.store[k] = v
    }

    removeItem(k: string) {
        delete this.store[k]
    }

    clear() {
        this.store = {}
    }
}

// Attach polyfill if not present (node env)
if (typeof (globalThis as any).localStorage === 'undefined') (globalThis as any).localStorage = new MemoryStorage()

// Convenience cast for tests
const mem: MemoryStorage = (globalThis as any).localStorage as MemoryStorage

describe('storage.ts', () => {
    beforeEach(() => mem.clear())

    it('getPrefs returns defaults and setPrefs persists', () => {
        const d = getPrefs()
        expect(d.wordLength).toBe(5)
        setPrefs({...d, wordLength: 7, language: 'en-US'})
        const after = getPrefs()
        expect(after.wordLength).toBe(7)
        expect(after.language).toBe('en-US')
    })

    it('getStats initializes empty stats and setStats persists', () => {
        const s = getStats()
        expect(s.daily.gamesPlayed).toBe(0)
        s.daily.gamesPlayed = 3
        setStats(s)
        const again = getStats()
        expect(again.daily.gamesPlayed).toBe(3)
    })

    it('daily progress roundtrip', () => {
        const day = getToday()
        const key = dailyKeyFor(day, 'en-US', 5)
        expect(mem.getItem(key)).toBeNull()
        setDailyProgress(day, 'en-US', 5, {answerHash: 'len:5', guesses: ['alpha'], board: [], keyboard: {}})
        const loaded = getDailyProgress(day, 'en-US', 5)
        expect(loaded?.guesses).toEqual(['alpha'])
    })

    it('freeplay progress roundtrip and clear', () => {
        expect(getFreeplayProgress('en-US', 5)).toBeNull()
        setFreeplayProgress('en-US', 5, {answer: 'alpha', guesses: [], board: [], keyboard: {}})
        expect(getFreeplayProgress('en-US', 5)?.answer).toBe('alpha')
        clearFreeplayProgress('en-US', 5)
        expect(getFreeplayProgress('en-US', 5)).toBeNull()
    })

    it('getToday matches YYYY-MM-DD format', () => {
        const today = getToday()
        expect(/^\d{4}-\d{2}-\d{2}$/.test(today)).toBe(true)
    })
})
