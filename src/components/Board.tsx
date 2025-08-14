import {memo} from "react";
import type {CSSVars} from "../helpers/types.ts";
import styles from "../styles/Board.module.less";
import Tile, {type TileState} from "./Tile.tsx";

export type Cell = { ch: string; state: TileState };

type Props = {
    rows: Cell[][];
    activeRow: number;              // Index of the row currently being filled
    current: string;                // characters currently typed for the active row
    wordLen: number;                // selected word length; drives grid columns
}

type BoardCSS = CSSVars<'--len'>;

/**
 * Board renders the grid of tiles. The active row show the user's
 * in-progress "current" input; other rows show their evaluated states.
 */
function BoardImpl({rows, activeRow, current, wordLen}: Props) {
    const boardStyle: BoardCSS = {'--len': wordLen};
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
                return (
                    <div className={styles.row} key={i} role="row" aria-rowindex={i + 1}>
                        {row.map((cell, j) => {
                            const showTyped = isActive && j < current.length;
                            const ch = showTyped ? current[j] : cell.ch;
                            const state: TileState = isActive ? 'empty' : cell.state;
                            return (
                                <div role="gridcell" aria-colindex={j + 1} key={`${i}-${j}`}>
                                    <Tile ch={ch} state={state}/>
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

