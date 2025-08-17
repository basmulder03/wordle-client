import {useEffect, useState} from "react";
import Board from "../components/Board.tsx";
import Keyboard from "../components/Keyboard.tsx";
import {useGame} from "../hooks/useGame.ts";
import {useI18n} from "../i18n/useI18n.ts";
import styles from '../styles/App.module.less';
import type {CSSVars} from "../types/css-vars.ts";

export default function App() {
    const {t, lang, setLang} = useI18n();
    const [mode, setMode] = useState<'daily' | 'freeplay'>('daily');
    const {
        ready, allowed, wordLen, rows, activeRow, current, letterStates, outcome, wordlistHref,
        setWordLen, handleKey, acknowledgeOutcome, invalidTick, newFreeplayGame
    } = useGame(lang, mode);

    // Physical keyboard listener
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => handleKey(e.key);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleKey]);

    // Outcome alerts (with timing)
    useEffect(() => {
        if (!outcome) return;
        const seconds = (outcome.durationMs / 1000).toFixed(1);
        if (outcome.type === 'win') {
            alert(t('winTimed', {seconds}));
        } else {
            alert(t('loseTimed', {word: outcome.answer, seconds}));
        }
        acknowledgeOutcome();
    }, [acknowledgeOutcome, outcome, t]);

    const mainStyle: CSSVars<'--len'> = {'--len': wordLen};

    if (!ready) return <p className={styles.app}>{t('loading')}</p>

    return (
        <div className={styles.app}>
            <div className={styles.modeSwitch} role="tablist" aria-label={t('mode')}>
                <button
                    role="tab" aria-selected={mode === 'daily'}
                    className={`${styles.tab} ${mode === 'daily' ? styles.tabActive : ''}`}
                    onClick={() => setMode('daily')}
                >{t('daily')}</button>
                <button
                    role="tab" aria-selected={mode === 'freeplay'}
                    className={`${styles.tab} ${mode === 'freeplay' ? styles.tabActive : ''}`}
                    onClick={() => setMode('freeplay')}
                >{t('freeplay')}</button>
            </div>
            <header className={styles.header}>
                <h1>{t('title')}</h1>
                <label>{t('length')}&nbsp;
                    <select
                        value={wordLen}
                        onChange={e => setWordLen(parseInt(e.target.value, 10))}
                    >
                        {allowed.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
                <label>{t('language')}&nbsp;
                    <select value={lang} onChange={e => setLang(e.target.value)}>
                        <option value="nl">Nederlands</option>
                        <option value="en">English</option>
                    </select>
                </label>
            </header>
            <main className={styles.main} style={mainStyle}>
                <Board rows={rows} activeRow={activeRow} current={current} wordLen={wordLen} invalidTick={invalidTick}/>
                <Keyboard onKey={handleKey} letterStates={letterStates}/>
                {mode === 'freeplay' && (
                    <div className={styles.actions}>
                        <button type="button" onClick={newFreeplayGame}>{t('playAgain')}</button>
                    </div>
                )}
            </main>

            <footer className={styles.footer}>
                <button onClick={() => {
                    localStorage.clear();
                    location.reload();
                }}>
                    {t('reset')}
                </button>
                <a href={wordlistHref} target="_blank" rel="noreferrer">
                    {t('wordlistLink')}
                </a>
            </footer>
        </div>
    )
}