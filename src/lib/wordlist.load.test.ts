import {afterEach, describe, expect, it, vi} from 'vitest'
import {currentWordlistUrl, loadWordlist} from './wordlist'

function makeResponse(body: string, status = 200) {
    return new Response(body, {status})
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('loadWordlist fallbacks', () => {
    it('falls back to legacy solutions filename when new one 404s', async () => {
        const calls: string[] = []
        const mock = vi.fn(async (url: string) => {
                calls.push(url)
                if (url.endsWith('en_5_solutions.txt')) return makeResponse('', 404)
                if (url.endsWith('en_5.txt')) return makeResponse('alpha\nbravo')
                return makeResponse('', 404)
            })
        ;(globalThis as any).fetch = mock

        const list = await loadWordlist('en', 5, 'solutions')
        expect(list).toEqual(['alpha', 'bravo'])
        expect(calls.some(u => u.endsWith('en_5_solutions.txt'))).toBe(true)
        expect(calls.some(u => u.endsWith('en_5.txt'))).toBe(true)
    })

    it('if guesses file missing, reuses solutions list', async () => {
        const calls: string[] = []
        const mock = vi.fn(async (url: string) => {
                calls.push(url)
                if (url.endsWith('en_5_guesses.txt')) return makeResponse('', 404)
                if (url.endsWith('en_5_solutions.txt')) return makeResponse('delta')
                return makeResponse('', 404)
            })
        ;(globalThis as any).fetch = mock

        const list = await loadWordlist('en', 5, 'guesses')
        expect(list).toEqual(['delta'])
        expect(calls.filter(u => u.endsWith('en_5_guesses.txt')).length).toBe(1)
        expect(calls.filter(u => u.endsWith('en_5_solutions.txt')).length).toBe(1)
    })
})

describe('currentWordlistUrl', () => {
    it('generates expected URL path suffix', () => {
        const url = currentWordlistUrl('en-US', 6, 'solutions')
        expect(url.endsWith('/wordlists/en_6_solutions.txt')).toBe(true)
    })
})
