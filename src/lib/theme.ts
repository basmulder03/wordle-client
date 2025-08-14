import {getPrefs, type Prefs, setPrefs} from './storage'

export type ThemeMode = 'auto' | 'light' | 'dark'

const CLASS_LIGHT = 'theme-light'
const CLASS_DARK = 'theme-dark'

let currentTheme: ThemeMode = 'auto'

function applyClass(mode: ThemeMode) {
    const root = document.documentElement
    root.classList.remove(CLASS_LIGHT, CLASS_DARK)

    if (mode === 'light') root.classList.add(CLASS_LIGHT)
    else if (mode === 'dark') root.classList.add(CLASS_DARK)

    currentTheme = mode
}

export function initTheme() {
    const prefs = getPrefs()
    const mode: ThemeMode = (prefs.theme as ThemeMode) || 'auto'
    applyClass(mode)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
        const p = getPrefs()
        if ((p.theme as ThemeMode) === 'auto') applyClass('auto')
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange) // Just for Safari compatibility
}

export function setTheme(mode: ThemeMode) {
    const prefs: Prefs = {...getPrefs(), theme: mode}
    setPrefs(prefs)
    applyClass(mode)
}

export function getTheme(): ThemeMode {
    return currentTheme
}
