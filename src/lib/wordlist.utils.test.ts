import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {ManifestV2} from './wordlist'
import {filenameFor, getAllowedLengths, localeToPrefix, pickDailyWord,} from './wordlist'

// Basic pure helpers
describe('wordlist helpers', () => {
    it('localeToPrefix normalizes language codes', () => {
        expect(localeToPrefix('en-US')).toBe('en')
        expect(localeToPrefix('nl-NL')).toBe('nl')
        expect(localeToPrefix('NL')).toBe('nl')
        expect(localeToPrefix('english')).toBe('en')
        expect(localeToPrefix('fr-FR')).toBe('nl') // fallback
    })

    it('filenameFor returns proper filenames', () => {
        expect(filenameFor('en-US', 5, 'solutions')).toBe('en_5_solutions.txt')
        expect(filenameFor('nl-NL', 6, 'guesses')).toBe('nl_6_guesses.txt')
    })

    describe('getAllowedLengths', () => {
        it('returns defaults when manifest null', () => {
            expect(getAllowedLengths('en-US', null)).toEqual([4, 5, 6, 7])
        })

        it('uses lengthsByLang when provided (dedup + sort)', () => {
            const m: ManifestV2 = {lengthsByLang: {en: [6, 5, 4, 5], nl: [7, 4]}}
            expect(getAllowedLengths('en-US', m)).toEqual([4, 5, 6])
            expect(getAllowedLengths('nl-NL', m)).toEqual([4, 7])
        })

        it('falls back to legacy counts with old naming', () => {
            const m: ManifestV2 = {counts: {'en_5.txt': 1, 'en_6.txt': 1, 'en_7.txt': 1}}
            expect(getAllowedLengths('en', m)).toEqual([5, 6, 7])
        })

        it('legacy counts with new naming variants', () => {
            const m: ManifestV2 = {counts: {'en_5_solutions.txt': 1, 'en_5_guesses.txt': 1, 'en_8_solutions.txt': 1}}
            expect(getAllowedLengths('en', m)).toEqual([5, 8])
        })
    })
})

// pickDailyWord (deterministic by date + list)

describe('pickDailyWord', () => {
    const originalFetch = global.fetch as any

    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        global.fetch = originalFetch
    })

    it('picks deterministic word based on date seed', async () => {
        const list = ['alpha', 'bravo', 'charlie']

        const fixed = new Date('2024-12-31T10:00:00Z')
        vi.setSystemTime(fixed)

        global.fetch = vi.fn(async () => ({ok: true, status: 200, text: async () => list.join('\n')})) as any

        const day = '2024-12-31'
        let seed = 0
        for (const c of day) seed = (seed * 31 + c.charCodeAt(0)) >>> 0
        const expected = list[seed % list.length]

        const picked = await pickDailyWord('en', 5)
        expect(picked).toBe(expected)
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })
})
