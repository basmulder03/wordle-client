import {describe, expect, it} from 'vitest'
import {evaluateGuess} from './wordlist'

// Helper to map c/p/a to states
const mapChar: Record<string, string> = {c: 'correct', p: 'present', a: 'absent'}
const expand = (sh: string) => sh.split('').map(c => mapChar[c])

interface Case {
    guess: string;
    answer: string;
    pattern: string;
    note?: string
}

const cases: Case[] = [
    {guess: 'abcde', answer: 'vwxyz', pattern: 'aaaaa', note: 'all absent'},
    {guess: 'eabcd', answer: 'abcde', pattern: 'ppppp', note: 'all present shifted'},
    {guess: 'allee', answer: 'apple', pattern: 'cpaac'},
    {guess: 'apple', answer: 'allee', pattern: 'caapc'},
    {guess: 'ababa', answer: 'abbey', pattern: 'ccapa'},
    {guess: 'llama', answer: 'bloom', pattern: 'acapa'},
    {guess: 'armor', answer: 'aroma', pattern: 'ccppa'},
    {guess: 'ttttt', answer: 'trend', pattern: 'caaaa'},
    {guess: 'tattt', answer: 'ttttt', pattern: 'caccc'},
    {guess: 'apple', answer: 'panel', pattern: 'ppapp'},
    {guess: 'llama', answer: 'banal', pattern: 'papap'},
    {guess: 'deadd', answer: 'adder', pattern: 'ppppa'},
    {guess: 'letter', answer: 'letter', pattern: 'cccccc'},
    {guess: 'czzzz', answer: 'crane', pattern: 'caaaa'},
    {guess: 'better', answer: 'letter', pattern: 'accccc'},
    {guess: 'cabba', answer: 'aabbc', pattern: 'pcccp'}
]

describe('evaluateGuess', () => {
    cases.forEach(({guess, answer, pattern, note}) => {
        it(`${guess} vs ${answer}${note ? ' - ' + note : ''}`, () => {
            const res = evaluateGuess(guess, answer).states
            expect(res).toEqual(expand(pattern))
        })
    })

    it('is case-insensitive', () => {
        const lower = evaluateGuess('apple', 'panel').states
        const upper = evaluateGuess('APPLE', 'PANEL').states
        expect(upper).toEqual(lower)
    })

    it('handles length mismatch defensively (truncates to guess length)', () => {
        const res = evaluateGuess('short', 'longerword').states
        expect(res).toHaveLength(5)
    })
})
