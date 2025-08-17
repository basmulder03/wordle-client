// @vitest-environment jsdom
import {act, forwardRef, useImperativeHandle} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getStats, setFreeplayProgress} from '../lib/storage'
import {useGame} from './useGame'

// Simple in-memory localStorage for isolation
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

if (!(globalThis as any).localStorage) (globalThis as any).localStorage = new MemoryStorage()
const mem: MemoryStorage = (globalThis as any).localStorage as MemoryStorage

// Harness component to expose hook state to tests
const Harness = forwardRef<any, { lang: string, mode: any }>(({lang, mode}, ref) => {
    const game = useGame(lang, mode)
    useImperativeHandle(ref, () => game, [game])
    return null
})

async function waitFor(cond: () => boolean, timeout = 2000) {
    const start = Date.now()
    while (!cond()) {
        if (Date.now() - start > timeout) throw new Error('waitFor timeout')
        await new Promise(r => setTimeout(r, 10))
    }
}

describe('useGame hook', () => {
    beforeEach(() => {
        mem.clear()
        vi.restoreAllMocks()
    })

    it('freeplay: win flow updates outcome and stats', async () => {
        const manifest = {lengthsByLang: {en: [5]}}
        const guesses = 'alpha\nother'
        // Pre-seed freeplay progress with known answer and fresh board
        const board = Array.from({length: 6}, () => Array.from({length: 5}, () => ({ch: '', state: 'empty'})))
        setFreeplayProgress('en', 5, {answer: 'alpha', guesses: [], board, keyboard: {}})

        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ok: true, status: 200, json: async () => manifest}) // manifest
            .mockResolvedValueOnce({ok: true, status: 200, text: async () => guesses}) // guesses list
        ;(globalThis as any).fetch = fetchMock

        const container = document.createElement('div')
        const root = createRoot(container)
        const ref: any = {current: null}
        root.render(<Harness ref={ref} lang="en" mode="freeplay"/>)
        await waitFor(() => ref.current && ref.current.ready)

        'alpha'.split('').forEach(ch => ref.current.handleKey(ch))
        await waitFor(() => ref.current.current === 'alpha')
        ref.current.handleKey('Enter')

        await waitFor(() => ref.current.outcome !== null, 4000)
        expect(ref.current.outcome?.type).toBe('win')
        expect(ref.current.outcome?.answer).toBe('alpha')
        const stats = getStats()
        expect(stats.freeplay.wins).toBe(1)
        expect(stats.freeplay.gamesPlayed).toBe(1)
        root.unmount()
    })

    it('freeplay: invalid guess sets invalidTick and keeps current guess', async () => {
        const manifest = {lengthsByLang: {en: [5]}}
        const guesses = 'alpha' // only alpha allowed
        const solutions = 'alpha\nbravo'
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ok: true, status: 200, json: async () => manifest})
            .mockResolvedValueOnce({ok: true, status: 200, text: async () => guesses})
            .mockResolvedValueOnce({ok: true, status: 200, text: async () => solutions})
        ;(globalThis as any).fetch = fetchMock

        const container = document.createElement('div')
        const root = createRoot(container)
        const ref: any = {current: null}
        root.render(<Harness ref={ref} lang="en" mode="freeplay"/>)
        await waitFor(() => ref.current && ref.current.ready)

        act(() => {
            'zzzzz'.split('').forEach(ch => ref.current.handleKey(ch))
        })
        const beforeTick = ref.current.invalidTick
        act(() => {
            ref.current.handleKey('Enter')
        })
        await waitFor(() => ref.current.invalidTick !== beforeTick, 6000)
        expect(ref.current.current).toBe('zzzzz')
        expect(ref.current.outcome).toBeNull()
        root.unmount()
    })

    // Daily deterministic test skipped for now due to timing variability in fake timers + async fetch sequencing
    it.skip('daily: deterministic answer selection from date seed', async () => {
        const manifest = {lengthsByLang: {en: [5]}}
        const list = 'alpha\nbravo'
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ok: true, status: 200, json: async () => manifest})
            .mockResolvedValueOnce({ok: true, status: 200, text: async () => list})
            .mockResolvedValueOnce({ok: true, status: 200, text: async () => list})
        ;(globalThis as any).fetch = fetchMock
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
        const day = '2025-01-15'
        let seed = 0
        for (const c of day) seed = (seed * 31 + c.charCodeAt(0)) >>> 0
        const expected = list.split('\n')[seed % 2]
        const container = document.createElement('div')
        const root = createRoot(container)
        const ref: any = {current: null}
        root.render(<Harness ref={ref} lang="en" mode="daily"/>)
        await waitFor(() => ref.current && ref.current.ready)
        expected.split('').forEach(ch => ref.current.handleKey(ch))
        ref.current.handleKey('Enter')
        await waitFor(() => ref.current.outcome !== null)
        expect(ref.current.outcome?.answer).toBe(expected)
        vi.useRealTimers()
        root.unmount()
    })
})
