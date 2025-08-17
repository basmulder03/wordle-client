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

    const mainStyle: CSSVars<'--len'> = {'--len': wordLen};

    const outcomeSeconds = outcome ? (outcome.durationMs / 1000).toFixed(1) : '';
    const outcomeMessage = outcome ? (outcome.type === 'win'
        ? t('winTimed', {seconds: outcomeSeconds})
        : t('loseTimed', {word: outcome.answer, seconds: outcomeSeconds})) : '';

    // Close on ESC when modal open
    useEffect(() => {
        if (!outcome) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') acknowledgeOutcome();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [outcome, acknowledgeOutcome]);

    if (!ready) {
        return <p className={styles.app}>{t('loading')}</p>
    }

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

            {outcome && (
                <div
                    className={styles.modalOverlay}
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) acknowledgeOutcome();
                    }}
                    role="button"
                    aria-label="Close modal"
                    tabIndex={0}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) acknowledgeOutcome();
                    }}
                    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="outcome-title">
                        <h2 id="outcome-title">{outcome.type === 'win' ? t('win') : t('lose', {word: outcome.answer})}</h2>
                        <p>{outcomeMessage}</p>
                        <div className={styles.modalActions}>
                            {mode === 'freeplay' && (
                                <button type="button" onClick={() => {
                                    acknowledgeOutcome();
                                    newFreeplayGame();
                                }}>
                                    {t('playAgain')}
                                </button>
                            )}
                            <button type="button" onClick={acknowledgeOutcome}>{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}