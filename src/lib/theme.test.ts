// @vitest-environment jsdom
import {beforeEach, describe, expect, it} from 'vitest'
import {setPrefs} from './storage'
import {getTheme, initTheme, setTheme} from './theme'

function makeMatchMedia(dark: boolean) {
    return (query: string): MediaQueryList => ({
        matches: dark && query.includes('dark'),
        media: query,
        onchange: null,
        addEventListener: () => {
        },
        removeEventListener: () => {
        },
        addListener: () => {
        }, // deprecated
        removeListener: () => {
        }, // deprecated
        dispatchEvent: () => true,
    } as MediaQueryList)
}

describe('theme.ts', () => {
    beforeEach(() => {
        document.documentElement.className = ''
        // provide mock
        ;(window as any).matchMedia = makeMatchMedia(true)
        setPrefs({wordLength: 5, language: 'en-US', theme: 'auto', sfx: true})
    })

    it('initTheme applies stored explicit light preference', () => {
        setPrefs({wordLength: 5, language: 'en-US', theme: 'light', sfx: true})
        initTheme()
        expect(document.documentElement.classList.contains('theme-light')).toBe(true)
    })

    it('setTheme switches classes', () => {
        initTheme() // auto -> no class
        setTheme('dark')
        expect(document.documentElement.classList.contains('theme-dark')).toBe(true)
        expect(getTheme()).toBe('dark')
        setTheme('light')
        expect(document.documentElement.classList.contains('theme-light')).toBe(true)
        expect(getTheme()).toBe('light')
    })
})
