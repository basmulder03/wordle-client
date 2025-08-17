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

function reconstructBoard(wordLen: number, guesses: string[], answer: string): Cell[][] {
    const board: Cell[][] = []
    for (let i = 0; i < guesses.length && i < MAX_ATTEMPTS; i++) {
        const g = guesses[i]
        const res = evaluateGuess(g, answer)
        board.push(g.split('').map((ch, idx) => ({ch, state: res.states[idx] as TileState})))
    }
    // Fill remaining rows
    while (board.length < MAX_ATTEMPTS) {
        board.push(Array.from({length: wordLen}, () => ({ch: '', state: 'empty' as TileState})))
    }
    return board
}

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
    const [startedAt, setStartedAt] = useState<number | null>(null)

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
                    let useBoard = prog.board as Cell[][]
                    if (!useBoard.length) {
                        // migrate empty board -> rebuild from guesses
                        useBoard = reconstructBoard(normalizedLen, prog.guesses, a)
                        setDailyProgress(today, lang, normalizedLen, {...prog, board: useBoard})
                    }
                    setRows(useBoard)
                    rebuildKeyTintsFromBoard(useBoard, prog.guesses)
                    setStartedAt(prog.startedAt ?? Date.now())
                    if (!prog.startedAt) {
                        setDailyProgress(today, lang, normalizedLen, {...prog, startedAt: Date.now()})
                    }
                } else {
                    const board = freshBoard(normalizedLen, setRows)
                    setLetterStates({})
                    const now = Date.now()
                    setStartedAt(now)
                    setDailyProgress(today, lang, normalizedLen, {
                        answerHash: `len:${a.length}`,
                        guesses: [],
                        board,
                        keyboard: {},
                        startedAt: now
                    })
                }
            } else {
                // freeplay: resume if unfinished; otherwise pick random
                const prog = getFreeplayProgress(lang, normalizedLen)
                if (prog?.answer && prog.board && prog.guesses) {
                    let useBoard = prog.board as Cell[][]
                    if (!useBoard.length) {
                        useBoard = reconstructBoard(normalizedLen, prog.guesses, prog.answer)
                        setFreeplayProgress(lang, normalizedLen, {...prog, board: useBoard})
                    }
                    setAnswer(prog.answer)
                    setRows(useBoard)
                    rebuildKeyTintsFromBoard(useBoard, prog.guesses)
                    setStartedAt(prog.startedAt ?? Date.now())
                    if (!prog.startedAt) {
                        setFreeplayProgress(lang, normalizedLen, {...prog, startedAt: Date.now()})
                    }
                } else {
                    const a = await pickRandomWord(lang, normalizedLen)
                    setAnswer(a)
                    const board = freshBoard(normalizedLen, setRows)
                    setLetterStates({})
                    const now = Date.now()
                    setStartedAt(now)
                    setFreeplayProgress(lang, normalizedLen, {
                        answer: a,
                        guesses: [],
                        board,
                        keyboard: {},
                        startedAt: now
                    })
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

        // persist progress per mode (without finishedAt yet)
        if (mode === 'daily') {
            const guesses = [...(getDailyProgress(today, lang, wordLen)?.guesses ?? []), current]
            const existing = getDailyProgress(today, lang, wordLen)
            setDailyProgress(today, lang, wordLen, {
                answerHash: `len:${answer.length}`,
                guesses,
                board: next,
                keyboard: {},
                startedAt: existing?.startedAt ?? startedAt ?? Date.now(),
                finishedAt: existing?.finishedAt
            })
        } else {
            const existing = getFreeplayProgress(lang, wordLen)
            const baseStarted = existing?.startedAt ?? startedAt ?? Date.now()
            const prev = existing ? {...existing, startedAt: baseStarted} : {
                answer,
                guesses: [],
                board: [],
                keyboard: {},
                startedAt: baseStarted
            }
            if (!prev.startedAt) prev.startedAt = Date.now()
            setFreeplayProgress(lang, wordLen, {...prev, guesses: [...prev.guesses, current], board: next})
        }

        // outcome + stats
        if (current === answer) {
            updateStats(mode, true)
            const durationMs = startedAt ? Date.now() - startedAt : 0
            setOutcome({type: 'win', answer, durationMs})
            // persist finishedAt
            if (mode === 'daily') {
                const existing = getDailyProgress(today, lang, wordLen)
                if (existing) setDailyProgress(today, lang, wordLen, {
                    ...existing,
                    finishedAt: existing.finishedAt ?? Date.now()
                })
            } else {
                const existing = getFreeplayProgress(lang, wordLen)
                if (existing) setFreeplayProgress(lang, wordLen, {
                    ...existing,
                    finishedAt: existing.finishedAt ?? Date.now()
                })
            }
        } else if (rowIdx + 1 >= MAX_ATTEMPTS) {
            updateStats(mode, false)
            const durationMs = startedAt ? Date.now() - startedAt : 0
            setOutcome({type: 'lose', answer, durationMs})
            if (mode === 'daily') {
                const existing = getDailyProgress(today, lang, wordLen)
                if (existing) setDailyProgress(today, lang, wordLen, {
                    ...existing,
                    finishedAt: existing.finishedAt ?? Date.now()
                })
            } else {
                const existing = getFreeplayProgress(lang, wordLen)
                if (existing) setFreeplayProgress(lang, wordLen, {
                    ...existing,
                    finishedAt: existing.finishedAt ?? Date.now()
                })
            }
        }

        setCurrent('')
    }, [current, wordLen, answer, rows, lang, today, mode, validGuesses, startedAt])

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
            const board = freshBoard(len, setRows)
            const now = Date.now();
            setStartedAt(now)
            setDailyProgress(getToday(), lang, len, { // new day context, safe
                answerHash: `len:${a.length}`,
                guesses: [],
                board,
                keyboard: {},
                startedAt: now
            })
        } else {
            const a = await pickRandomWord(lang, len)
            setAnswer(a)
            const board = freshBoard(len, setRows)
            const now = Date.now();
            setStartedAt(now)
            setFreeplayProgress(lang, len, {answer: a, guesses: [], board, keyboard: {}, startedAt: now})
        }
    }, [allowed, lang, mode])

    const newFreeplayGame = useCallback(async () => {
        if (mode !== 'freeplay') return
        const a = await pickRandomWord(lang, wordLen)
        setAnswer(a)
        const board = freshBoard(wordLen, setRows)
        setCurrent('');
        setLetterStates({});
        setOutcome(null)
        const now = Date.now();
        setStartedAt(now)
        setFreeplayProgress(lang, wordLen, {answer: a, guesses: [], board, keyboard: {}, startedAt: now})
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
    const board = Array.from({length: 6}, () => Array.from({length: len}, () => ({
        ch: '',
        state: 'empty' as TileState
    })))
    setRows(board)
    return board
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
