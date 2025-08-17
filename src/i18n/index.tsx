import {createContext, type ReactNode, useCallback, useMemo, useState} from "react";
import {getPrefs, setPrefs} from "../lib/storage.ts";

import en from './locales/en.json';
import nl from './locales/nl.json';

type Dict = Record<string, string>;
const DICTS: Record<string, Dict> = {
    'en-US': en as Dict,
    'nl-NL': nl as Dict,
}

type I18nCtx = {
    lang: string;
    t: (key: string, vars?: Record<string, string | number>) => string;
    setLang: (lang: string) => void;
}

export const I18nContext = createContext<I18nCtx | null>(null);

function detectInitial(): string {
    const saved = getPrefs().language;
    if (saved && DICTS[saved]) {
        return saved;
    }
    // fall back to browser language
    const nav = (navigator.language || 'en-US').toLowerCase();
    if (nav.startsWith('nl')) {
        return 'nl-NL';
    }
    return 'en-US';
}

export function I18nProvider({children}: { children: ReactNode }) {
    const [lang, setLangState] = useState<string>(detectInitial());

    const setLang = useCallback((l: string) => {
        const normalized = l.toLowerCase().startsWith('nl') ? 'nl-NL' : 'en-US';
        setLangState(normalized);
        const p = getPrefs();
        setPrefs({...p, language: normalized});
    }, []);

    const t = useCallback((key: string, vars: Record<string, string | number> = {}) => {
        const dict = DICTS[lang] || DICTS['en-US'];
        let s = dict[key] ?? key;
        for (const [k, v] of Object.entries(vars)) {
            s = s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
        }
        return s;
    }, [lang]);

    const value = useMemo(() => ({lang, t, setLang}), [lang, t, setLang]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}