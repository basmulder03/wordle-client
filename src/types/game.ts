export type TileState = 'empty' | 'correct' | 'present' | 'absent';
export type KeyState = 'correct' | 'present' | 'absent' | undefined;
export type LetterState = 'correct' | 'present' | 'absent' | 'empty';
export type Cell = { ch: string; state: TileState };
export type EvalResult = { states: LetterState[] };
export type Outcome = { type: 'win' | 'lose'; answer: string; } | null;
