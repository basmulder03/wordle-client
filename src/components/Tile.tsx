import {memo} from "react";
import styles from "../styles/Tile.module.less";

export type TileState = 'empty' | 'correct' | 'present' | 'absent';

type Props = {
    ch: string;
    state: TileState;
}

/**
 * Tile renders a single letter box in the board grid.
 * State controls its color and animations.
 */
function TileImpl({ch, state}: Props) {
    // Normalize character to uppercase for display
    const letter = ch?.toUpperCase() || '';

    return (
        <div className={`${styles.tile} ${styles[state]}`}
             aria-label={letter || 'empty'}
             aria-live="polite"
        >
            {letter}
        </div>
    )
}

const Tile = memo(TileImpl);
export default Tile;