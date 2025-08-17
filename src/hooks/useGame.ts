// merged enhanced useGame with daily & freeplay modes
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
    getDailyProgress,
    getFreeplayProgress,
    getPrefs,
    getStats,
    getToday,
    setDailyProgress,
    setFreeplayProgress,
    setPrefs,
    setStats
} from '../lib/storage.ts'
import {
    currentWordlistUrl,
    evaluateGuess,
    getAllowedLengths,
    loadManifest,
    loadWordlist,
    pickDailyWord,
    pickRandomWord
} from '../lib/wordlist.ts'
import type {Cell, GameMode, KeyState, Outcome, TileState} from '../types/game.ts'

const MAX_ATTEMPTS = 6

// Backward compatible signature: mode defaults to 'daily' if omitted
export function useGame(lang: string, mode: GameMode = 'daily') {
    const [ready, setReady] = useState(false)
    const [allowed, setAllowed] = useState<number[]>([])
    const [wordLen, setWordLen] = useState<number>(getPrefs().wordLength ?? 5)
    const [answer, setAnswer] = useState('')
    const [rows, setRows] = useState<Cell[][]>([])
    const [current, setCurrent] = useState('')
    const [letterStates, setLetterStates] = useState<Record<string, KeyState>>({})
    const [outcome, setOutcome] = useState<Outcome>(null)

    const [validGuesses, setValidGuesses] = useState<Set<string>>(new Set())
    const [invalidTick, setInvalidTick] = useState<number>(0)

    const today = useMemo(getToday, [])
    const activeRow = useMemo(() => rows.findIndex(r => r.some(c => c.ch === '')), [rows])

    // boot
    useEffect(() => {
        (async () => {
            setReady(false)
            const manifest = await loadManifest()
            const allowedLengths = getAllowedLengths(lang, manifest)
            setAllowed(allowedLengths)

            const normalizedLen = allowedLengths.includes(wordLen) ? wordLen : allowedLengths[0]
            if (normalizedLen !== wordLen) {
                setWordLen(normalizedLen)
                setPrefs({...getPrefs(), wordLength: normalizedLen})
            }

            // Load guesses for validation
            const guesses = await loadWordlist(lang, normalizedLen, 'guesses')
            setValidGuesses(new Set(guesses))

            // Load or create a game by mode
            if (mode === 'daily') {
                const a = await pickDailyWord(lang, normalizedLen)
                setAnswer(a)

                const prog = getDailyProgress(today, lang, normalizedLen)
                if (prog?.board && prog?.guesses) {
                    setRows(prog.board as Cell[][])
                    rebuildKeyTintsFromBoard(prog.board as Cell[][], prog.guesses)
                } else {
                    freshBoard(normalizedLen, setRows)
                    setLetterStates({})
                }
            } else {
                // freeplay: resume if unfinished; otherwise pick random
                const prog = getFreeplayProgress(lang, normalizedLen)
                if (prog?.answer && prog.board && prog.guesses) {
                    setAnswer(prog.answer)
                    setRows(prog.board as Cell[][])
                    rebuildKeyTintsFromBoard(prog.board as Cell[][], prog.guesses)
                } else {
                    const a = await pickRandomWord(lang, normalizedLen)
                    setAnswer(a)
                    freshBoard(normalizedLen, setRows)
                    setLetterStates({})
                    setFreeplayProgress(lang, normalizedLen, {answer: a, guesses: [], board: [], keyboard: {}})
                }
            }

            setCurrent('')
            setOutcome(null)
            setReady(true)
        })()
    }, [lang, mode])

    const handleKey = useCallback((key: string) => {
        if (!ready) return
        if (/^[a-zA-Z]$/.test(key) && current.length < wordLen) {
            setCurrent(c => c + key.toLowerCase())
        } else if (key === 'Backspace') {
            setCurrent(c => c.slice(0, -1))
        } else if (key === 'Enter' && current.length === wordLen) {
            submit()
        }
    }, [ready, current, wordLen])

    const submit = useCallback(() => {
        if (current.length !== wordLen) return
        if (!validGuesses.has(current)) {
            setInvalidTick(Date.now());
            return
        }

        const res = evaluateGuess(current, answer)
        const next = [...rows]
        const rowIdx = next.findIndex(r => r.some(c => c.ch === ''))
        if (rowIdx === -1) return
        next[rowIdx] = current.split('').map((ch, i) => ({ch, state: res.states[i] as TileState}))
        setRows(next)
        mergeKeyboardStates(current, res.states as TileState[], setLetterStates)

        // persist progress per mode
        if (mode === 'daily') {
            const guesses = [...(getDailyProgress(today, lang, wordLen)?.guesses ?? []), current]
            setDailyProgress(today, lang, wordLen, {
                answerHash: `len:${answer.length}`,
                guesses,
                board: next,
                keyboard: {}
            })
        } else {
            const prev = getFreeplayProgress(lang, wordLen) || {answer, guesses: [], board: [], keyboard: {}}
            setFreeplayProgress(lang, wordLen, {...prev, guesses: [...prev.guesses, current], board: next})
        }

        // outcome + stats
        if (current === answer) {
            updateStats(mode, true)
            setOutcome({type: 'win', answer})
        } else if (rowIdx + 1 >= MAX_ATTEMPTS) {
            updateStats(mode, false)
            setOutcome({type: 'lose', answer})
        }

        setCurrent('')
    }, [current, wordLen, answer, rows, lang, today, mode, validGuesses])

    const changeLength = useCallback(async (len: number) => {
        if (!allowed.includes(len)) return
        setWordLen(len);
        setPrefs({...getPrefs(), wordLength: len})

        const guesses = await loadWordlist(lang, len, 'guesses')
        setValidGuesses(new Set(guesses))
        setOutcome(null);
        setCurrent('');
        setLetterStates({})

        if (mode === 'daily') {
            const a = await pickDailyWord(lang, len)
            setAnswer(a)
            freshBoard(len, setRows)
        } else {
            const a = await pickRandomWord(lang, len)
            setAnswer(a)
            freshBoard(len, setRows)
            setFreeplayProgress(lang, len, {answer: a, guesses: [], board: [], keyboard: {}})
        }
    }, [allowed, lang, mode])

    const newFreeplayGame = useCallback(async () => {
        if (mode !== 'freeplay') return
        const a = await pickRandomWord(lang, wordLen)
        setAnswer(a)
        freshBoard(wordLen, setRows)
        setCurrent('');
        setLetterStates({});
        setOutcome(null)
        setFreeplayProgress(lang, wordLen, {answer: a, guesses: [], board: [], keyboard: {}})
    }, [mode, lang, wordLen])

    const wordlistHref = useMemo(() => currentWordlistUrl(lang, wordLen, 'solutions'), [lang, wordLen])

    return {
        ready, allowed, wordLen, rows, activeRow, current, letterStates, outcome, wordlistHref,
        setWordLen: changeLength, handleKey, acknowledgeOutcome: () => setOutcome(null),
        invalidTick,
        mode, newFreeplayGame,
    }
}

// -------- helpers ----------
function freshBoard(len: number, setRows: (r: any) => void) {
    setRows(Array.from({length: 6}, () => Array.from({length: len}, () => ({ch: '', state: 'empty' as TileState}))))
}

function rebuildKeyTintsFromBoard(_board: { ch: string; state: TileState }[][], _guesses: string[]) {
    // no-op here; keyboard rebuild happens inside the previous version if needed
}

function mergeKeyboardStates(guess: string, states: TileState[], setLetterStates: React.Dispatch<React.SetStateAction<Record<string, any>>>) {
    const rank = {correct: 3, present: 2, absent: 1, empty: 0} as const
    setLetterStates(prev => {
        const next = {...prev}
        guess.split('').forEach((ch, i) => {
            const st = states[i]
            if (st === 'empty') return
            const pr = prev[ch] ? rank[prev[ch] as keyof typeof rank] : 0
            if (rank[st] > pr) next[ch] = st
        })
        return next
    })
}

function updateStats(mode: GameMode, win: boolean) {
    const s = getStats()
    const bucket = s[mode]
    bucket.gamesPlayed++
    if (win) {
        bucket.wins++;
        bucket.currentStreak++;
        bucket.maxStreak = Math.max(bucket.maxStreak, bucket.currentStreak)
    } else {
        bucket.currentStreak = 0
    }
    setStats(s)
}
