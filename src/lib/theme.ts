import {getPrefs, type Prefs, setPrefs} from "./storage.ts";

export type ThemeMode = 'auto' | 'light' | 'dark';

const CLASS_LIGHT = 'theme-light';
const CLASS_DARK = 'theme-dark';

function applyClass(mode: ThemeMode) {
    const root = document.documentElement;
    root.classList.remove(CLASS_LIGHT, CLASS_DARK);

    if (mode === 'light') {
        root.classList.add(CLASS_LIGHT);
    } else if (mode === 'dark') {
        root.classList.add(CLASS_DARK);
    }
    // 'auto' mode is handled by the browser's default theme
}

export function initTheme() {
    const prefs = getPrefs();
    const mode: ThemeMode = (prefs.theme as ThemeMode) || 'auto';
    applyClass(mode);

    // Keep in sync when the system theme changes and we're in 'auto' mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
        const p = getPrefs();
        if ((p.theme as ThemeMode) === 'auto') {
            applyClass('auto');
        }
    }
    mq.addEventListener('change', onChange);
}

export function setTheme(mode: ThemeMode) {
    const prefs: Prefs = {...getPrefs(), theme: mode};
    setPrefs(prefs);
    applyClass(mode);
}