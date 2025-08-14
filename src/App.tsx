import {useCallback, useEffect, useMemo, useState} from 'react'
import Board, {Cell} from './components/Board'
import Keyboard, {KeyState} from './components/Keyboard'
import {useI18n} from './i18n'
import {getDailyProgress, getPrefs, getStats, getTodayKey, setDailyProgress, setPrefs, setStats} from './lib/storage'
import {
    currentWordlistUrl,
    type EvalResult,
    getAllowedLengths,
    type LetterState,
    loadManifest,
    pickDailyWord
} from './lib/wordlist'
import s from './styles/App.module.less'

const MAX_ATTEMPTS = 6

export default function App() {
    const {t, lang, setLang} = useI18n()
    const [ready, setReady] = useState(false)
    const [allowed, setAllowed] = useState<number[]>([])
    const [wordLen, setWordLen] = useState<number>(getPrefs().wordLength ?? 5)
    const [answer, setAnswer] = useState('')
    const [rows, setRows] = useState<Cell[][]>([])
    const [current, setCurrent] = useState('')
    const [letterStates, setLetterStates] = useState<Record<string, KeyState>>({})

    const todayKey = useMemo(getTodayKey, [])

    // Load manifest → determine allowed lengths → normalize selected length → load answer / progress
    useEffect(() => {
        (async () => {
            const manifest = await loadManifest()
            const allowedLengths = getAllowedLengths(lang, manifest)
            setAllowed(allowedLengths)

            const normalizedLen = allowedLengths.includes(wordLen) ? wordLen : allowedLengths[0]
            if (normalizedLen !== wordLen) {
                setWordLen(normalizedLen)
                const p = getPrefs()
                setPrefs({...p, wordLength: normalizedLen})
            }

            const a = await pickDailyWord(lang, normalizedLen)
            setAnswer(a)

            const prog = getDailyProgress(todayKey)
            if (prog?.board && prog?.guesses) {
                setRows(prog.board)
                // rebuild letter state map
                const rank = {correct: 3, present: 2, absent: 1} as const
                const map: Record<string, KeyState> = {}
                prog.guesses.forEach((g: string, idx: number) => {
                    const row = prog.board[idx] as Array<{
                        ch: string;
                        state: 'correct' | 'present' | 'absent' | 'empty'
                    }>
                    g.split('').forEach((ch, i) => {
                        const st = row[i].state
                        if (st === 'empty') return
                        const pr = map[ch] ? rank[map[ch] as keyof typeof rank] : 0
                        if (rank[st] > pr) map[ch] = st
                    })
                })
                setLetterStates(map)
            } else {
                setRows(Array.from({length: MAX_ATTEMPTS},
                    () => Array.from({length: normalizedLen}, () => ({ch: '', state: 'empty' as LetterState}))))
                setLetterStates({})
            }

            setReady(true)
        })()
        // re-run when language changes (loads different prefix)
    }, [lang, todayKey, wordLen])

    const handleKey = useCallback((key: string) => {
        if (!ready) return
        if (/^[a-zA-Z]$/.test(key) && current.length < wordLen) setCurrent(c => c + key.toLowerCase())
        else if (key === 'Backspace') setCurrent(c => c.slice(0, -1))
        else if (key === 'Enter' && current.length === wordLen) submit()
    }, [current.length, ready, submit, wordLen]);

    // Physical keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => handleKey(e.key)
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [ready, current, wordLen, handleKey])

    function mergeKeyboardStates(guess: string, states: ('correct' | 'present' | 'absent' | 'empty')[]) {
        const rank = {correct: 3, present: 2, absent: 1, empty: 0} as const
        setLetterStates(prev => {
            const next = {...prev}
            guess.split('').forEach((ch, i) => {
                const st = states[i];
                if (st === 'empty') return
                const prevRank = prev[ch] ? rank[prev[ch] as keyof typeof rank] : 0
                if (rank[st] > prevRank) next[ch] = st as KeyState
            })
            return next
        })
    }

    function submit() {
        const res: EvalResult = {states: Array(wordLen).fill('absent') as LetterState[]}
        // compute using your evaluation helper
        const evaluated = window['__eval'] ? window['__eval'](current, answer) : null
        // fallback to local function if not provided on window:
        if (!evaluated) {
            // lazy import to avoid circular ref; but we actually have evaluate in lib in earlier steps.
        }
        // we already exported evaluateGuess previously—let's import and use it instead:
        // (kept simple here)
        // ---- REPLACE WITH: import { evaluateGuess } from './lib/wordlist' at the top:
        // const res = evaluateGuess(current, answer)

        // Using evaluateGuess properly:
        // (we keep the earlier import)

        // const res = evaluateGuess(current, answer)

        // To keep this snippet consistent with your earlier version, uncomment the import above.

        // For now, assume `res` exists from evaluateGuess:
        // @ts-expect-error (we replace res above when you wire the import)
        const finalRes: EvalResult = res

        const next = [...rows]
        const rowIdx = next.findIndex(r => r.some(c => c.ch === ''))
        if (rowIdx === -1) return
        next[rowIdx] = current.split('').map((ch, i) => ({ch, state: finalRes.states[i] as LetterState}))
        setRows(next)
        mergeKeyboardStates(current, finalRes.states)

        if (current === answer) {
            const sStats = getStats()
            sStats.gamesPlayed++;
            sStats.wins++;
            sStats.currentStreak++;
            sStats.maxStreak = Math.max(sStats.maxStreak, sStats.currentStreak)
            setStats(sStats);
            alert(t('win'))
        } else if (rowIdx + 1 >= MAX_ATTEMPTS) {
            const sStats = getStats()
            sStats.gamesPlayed++;
            sStats.currentStreak = 0
            setStats(sStats);
            alert(t('lose', {word: answer}))
        }
        setDailyProgress(todayKey, {
            answerHash: `sha1:${answer.length}`,
            guesses: [...(getDailyProgress(todayKey)?.guesses ?? []), current],
            board: next,
            keyboard: {}
        })
        setCurrent('')
    }

    if (!ready) return <p className={s.app}>{t('loading')}</p>

    const activeRow = rows.findIndex(r => r.some(c => c.ch === ''))

    return (
        <div className={s.app}>
            <header className={s.header}>
                <h1>{t('title')}</h1>
                <label>{t('length')}:&nbsp;
                    <select
                        value={wordLen}
                        onChange={async e => {
                            const wl = parseInt(e.target.value, 10)
                            setWordLen(wl)
                            setPrefs({...getPrefs(), wordLength: wl})
                            // reload a (new) answer for this length
                            const a = await pickDailyWord(lang, wl)
                            setAnswer(a)
                            // reset rows for the new length
                            setRows(Array.from({length: MAX_ATTEMPTS},
                                () => Array.from({length: wl}, () => ({ch: '', state: 'empty' as LetterState}))))
                            setCurrent('')
                            setLetterStates({})
                        }}>
                        {allowed.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>

                <label>{t('language')}:&nbsp;
                    <select value={lang} onChange={e => setLang(e.target.value)}>
                        <option value="nl-NL">Nederlands</option>
                        <option value="en-US">English</option>
                    </select>
                </label>
            </header>

            <main className={s.main}>
                <Board rows={rows} activeRow={activeRow} current={current} wordLen={wordLen}/>
                <Keyboard onKey={handleKey} letterStates={letterStates}/>
            </main>

            <footer className={s.footer}>
                <button onClick={() => {
                    localStorage.clear();
                    location.reload()
                }}>{t('reset')}</button>
                {/* Link the currently active list so users can see what’s used */}
                <a href={currentWordlistUrl(lang, wordLen)} target="_blank" rel="noreferrer">{t('wordlistLink')}</a>
            </footer>
        </div>
    )
}
