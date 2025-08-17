import {afterEach, describe, expect, it, vi} from 'vitest'
import {loadManifest} from './wordlist'

afterEach(() => {
    vi.restoreAllMocks()
})

function makeResponse(body: string, status = 200) {
    return new Response(body, {status, headers: {'Content-Type': 'application/json'}})
}

describe('loadManifest', () => {
    it('returns JSON when fetch ok', async () => {
        const manifest = {version: 2, lengthsByLang: {en: [4, 5]}, sources: []}
        ;(globalThis as any).fetch = vi.fn(async () => makeResponse(JSON.stringify(manifest)))
        const loaded = await loadManifest()
        expect(loaded?.lengthsByLang?.en).toEqual([4, 5])
    })
    it('returns null on network error', async () => {
        ;(globalThis as any).fetch = vi.fn(async () => {
            throw new Error('offline')
        })
        const loaded = await loadManifest()
        expect(loaded).toBeNull()
    })
    it('returns null on non-ok status', async () => {
        ;(globalThis as any).fetch = vi.fn(async () => makeResponse('{}', 404))
        const loaded = await loadManifest()
        expect(loaded).toBeNull()
    })
})

describe('pickRandomWord', () => {
    it('returns one of the solutions list', async () => {
        const list = ['alpha', 'beta', 'gamma']
        ;(globalThis as any).fetch = vi.fn(async () => new Response(list.join('\n'), {status: 200}))
        const orig = Math.random
        Math.random = () => 0.5 // deterministic index 1
        const {pickRandomWord} = await import('./wordlist')
        const w = await pickRandomWord('en', 5)
        expect(['alpha', 'beta', 'gamma']).toContain(w)
        Math.random = orig
    })
})
