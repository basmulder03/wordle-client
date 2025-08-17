import {type CSSProperties, memo, useMemo} from "react";
import styles from "../styles/Tile.module.less";
import type {CSSVars} from "../types/css-vars.ts";
import type {TileState} from '../types/game';

export type AnimFlags = {
    /** card-flip animation (use for reveal) */
    flip?: boolean;
    /** quick scale-up (use when typing a new letter) */
    pop?: boolean;
    /** invalid word jiggle */
    shake?: boolean;
    /** staggered reveal delay in ms (applied to flip/pop) */
    delayMs?: number;
}

type Props = {
    ch: string;
    state: TileState;
    animate?: AnimFlags;
    /** additional className if you need custom styling from parent */
    className?: string;
}

type TileCSS = CSSVars<'--reveal-delay'>;

/**
 * Tile renders a single letter box. It supports:
 * - state-based coloring (empty, correct, present, absent)
 * - flip/pop/shake animations
 * - optional staggered reveal delays.
 */
function TileImpl({ch, state, animate, className}: Props) {
    // Normalize character to uppercase for display
    const letter = ch?.toUpperCase() || '';
    const flags = animate || {};

    const classes = useMemo(() => {
        const list = [styles.tile, styles[state]];
        if (flags.flip) list.push(styles.flip);
        if (flags.pop) list.push(styles.pop);
        if (flags.shake) list.push(styles.shake);
        if (className) list.push(className);
        return list.join(' ');
    }, [state, flags.flip, flags.pop, flags.shake, className]);

    const style = useMemo<TileCSS | undefined>(() => {
        if (flags.delayMs == null) return undefined;
        return {'--reveal-delay': `${flags.delayMs}ms`};
    }, [flags.delayMs])

    return (
        <div className={classes}
             style={style as CSSProperties}
             data-state={state}
             aria-label={letter || 'empty'}
             aria-live="polite"
             role="gridcell"
        >
            {letter}
        </div>
    )
}

const Tile = memo(TileImpl);
export default Tile;