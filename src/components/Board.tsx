import {memo, useEffect, useRef, useState} from "react";
import styles from "../styles/Board.module.less";
import type {CSSVars} from "../types/css-vars.ts";
import type {TileState} from "../types/game.ts";
import Tile from "./Tile.tsx";

export type Cell = { ch: string; state: TileState };

type Props = {
    rows: Cell[][];
    activeRow: number;              // Index of the row currently being filled
    current: string;                // characters currently typed for the active row
    wordLen: number;                // selected word length; drives grid columns
    invalidTick?: number;
}

type BoardCSS = CSSVars<'--len'>;

/**
 * Board renders the grid of tiles. The active row show the user's
 * in-progress "current" input; other rows show their evaluated states.
 */
function BoardImpl({rows, activeRow, current, wordLen, invalidTick}: Props) {
    const boardStyle: BoardCSS = {'--len': wordLen};

    // Shake animation state when an invalid guess is submitted
    const [shake, setShake] = useState(false);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (!invalidTick) return;
        setShake(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setShake(false), 600); // duration matches CSS
    }, [invalidTick]);

    return (
        <div
            className={styles.board}
            style={boardStyle}
            role="grid"
            aria-rowcount={rows.length}
            aria-colcount={wordLen}
        >
            {rows.map((row, i) => {
                const isActive = i === activeRow;
                const rowClass = isActive && shake ? styles.shakeRow : undefined;
                return (
                    <div className={`${styles.row} ${rowClass ?? ''}`} key={i} role="row" aria-rowindex={i + 1}>
                        {row.map((cell, j) => {
                            const showTyped = isActive && j < current.length;
                            const ch = showTyped ? current[j] : cell.ch;
                            const state: TileState = isActive ? 'empty' : cell.state;
                            return (
                                <div role="gridcell" aria-colindex={j + 1} key={`${i}-${j}`}>
                                    <Tile ch={ch} state={state}
                                          animate={isActive && shake ? {shake: true} : undefined}/>
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

const Board = memo(BoardImpl);
export default Board;
