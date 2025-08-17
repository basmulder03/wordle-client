// UI cell states
import {useCallback, useEffect, useMemo, useState} from "react";
import {getDailyProgress, getPrefs, getStats, getToday, setDailyProgress, setPrefs, setStats} from "../lib/storage.ts";
import {currentWordlistUrl, evaluateGuess, getAllowedLengths, loadManifest, pickDailyWord} from "../lib/wordlist.ts";
import type {Cell, KeyState, Outcome, TileState} from '../types/game';


const MAX_ATTEMPTS = 6;

export function useGame(lang: string) {
    const [ready, setReady] = useState(false);
    const [allowed, setAllowed] = useState<number[]>([]);
    const [wordLen, setWordLen] = useState<number>(getPrefs().wordLength ?? 5);
    const [answer, setAnswer] = useState<string>('');
    const [rows, setRows] = useState<Cell[][]>([]);
    const [current, setCurrent] = useState('');
    const [letterStates, setLetterStates] = useState<Record<string, KeyState>>({});
    const [outcome, setOutcome] = useState<Outcome>(null);

    const today = useMemo(() => getToday(), [])

    // Load manifest -> allowed lengths -> normalize selection -> load daily answer and progress
    useEffect(() => {
        (async () => {
            setReady(false);
            const manifest = await loadManifest();
            const allowedLengths = getAllowedLengths(lang, manifest);
            setAllowed(allowedLengths);

            const normalizedLen = allowedLengths.includes(wordLen) ? wordLen : allowedLengths[0];
            if (normalizedLen !== wordLen) {
                setWordLen(normalizedLen);
                const p = getPrefs();
                setPrefs({...p, wordLength: normalizedLen});
            }

            const a = await pickDailyWord(lang, normalizedLen);
            setAnswer(a);

            // restore progress (scoped by day + lang + length)
            const prog = getDailyProgress(today, lang, normalizedLen);
            if (prog?.board && prog?.guesses) {
                setRows(prog.board as Cell[][]);
                // rebuild keyboard tints
                const rank = {correct: 3, present: 2, absent: 1} as const;
                const map: Record<string, KeyState> = {};
                prog.guesses.forEach((g: string, idx: number) => {
                    const row = prog.board[idx] as Array<{ ch: string; state: TileState }>;
                    g.split('').forEach((ch, i) => {
                        const st = row[i].state;
                        if (st === 'empty') return;
                        const pr = map[ch] ? rank[map[ch] as keyof typeof rank] : 0;
                        if (rank[st] > pr) map[ch] = st;
                    })
                });
                setLetterStates(map);
            } else {
                // fresh board
                setRows(Array.from({length: MAX_ATTEMPTS}, () => Array.from({length: normalizedLen}, () => ({
                    ch: '',
                    state: 'empty' as TileState
                }))));
                setLetterStates({});
            }
            setCurrent('');
            setOutcome(null);
            setReady(true);
        })();
    }, [lang, today, wordLen]) // re-run on language change, date change or word length change

    // Active row is the first row with any empty tiles
    const activeRow = useMemo(() => {
        return rows.findIndex(row => row.some(cell => cell.state === 'empty'));
    }, [rows]);

    // Merge keyboard tints with precedence: correct > present > absent
    const mergeKeyboardStates = useCallback((guess: string, states: TileState[]) => {
        const rank = {correct: 3, present: 2, absent: 1} as const;
        setLetterStates(prev => {
            const next = {...prev};
            guess.split('').forEach((ch, i) => {
                const st = states[i];
                if (st === 'empty') return;
                const prevRank = prev[ch] ? rank[prev[ch] as keyof typeof rank] : 0;
                if (rank[st] > prevRank) next[ch] = st;
            })
            return next;
        });
    }, [setLetterStates]);

    // Submit guess
    const submit = useCallback(() => {
        if (current.length !== wordLen) return;
        const res = evaluateGuess(current, answer);
        const next = [...rows];
        const rowIdx = next.findIndex(r => r.some(c => c.ch === ''))
        if (rowIdx === -1) return; // no empty rows left

        next[rowIdx] = current.split('').map((ch, i) => ({ch, state: res.states[i]}));
        setRows(next);
        mergeKeyboardStates(current, res.states);

        const guesses = [
            ...(getDailyProgress(today, lang, wordLen)?.guesses || []),
            current
        ];
        setDailyProgress(today, lang, wordLen, {
            answerHash: `len:${answer.length}`, // simple fingerprint
            guesses,
            board: next,
            keyboard: {} // (optional) can persist key tints here if needed
        });

        if (current === answer) {
            const s = getStats();
            s.gamesPlayed++;
            s.wins++;
            s.currentStreak++;
            s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
            setStats(s);
            setOutcome({type: 'win', answer});
        } else if (rowIdx + 1 >= MAX_ATTEMPTS) {
            const s = getStats();
            s.gamesPlayed++;
            s.currentStreak = 0;
            setStats(s);
            setOutcome({type: 'lose', answer});
        }

        setCurrent('');
    }, [current, wordLen, answer, rows, mergeKeyboardStates, today, lang]);

    // Handle physical or on-screen keyboard input
    const handleKey = useCallback((key: string) => {
        if (!ready) return;
        if (/^[a-zA-Z]$/.test(key) && current.length < wordLen) {
            setCurrent(c => c + key.toLowerCase());
        } else if (key === 'Backspace') {
            setCurrent(c => c.slice(0, -1));
        } else if (key === 'Enter' && current.length === wordLen) {
            submit();
        }
    }, [ready, current, wordLen, submit]);

    // Change word length from UI
    const changeLength = useCallback(async (len: number) => {
        if (!allowed.includes(len)) return;
        setWordLen(len);
        const p = getPrefs();
        setPrefs({...p, wordLength: len});

        // new answer + fresh board for the new length
        const a = await pickDailyWord(lang, len);
        setAnswer(a);
        setRows(Array.from({length: MAX_ATTEMPTS}, () => Array.from({length: len}, () => ({
            ch: '',
            state: 'empty' as TileState
        }))));
        setCurrent('');
        setOutcome(null);
        setLetterStates({});
    }, [allowed, lang]);

    // For footer: link to the exact wordlist file in use
    const wordlistHref = useMemo(() => currentWordlistUrl(lang, wordLen), [lang, wordLen]);

    return {
        // State
        ready, allowed, wordLen, rows, activeRow, current, letterStates, outcome, wordlistHref,
        // Actions
        setWordLen: changeLength,
        handleKey,
        acknowledgeOutcome: () => setOutcome(null),
    }
}