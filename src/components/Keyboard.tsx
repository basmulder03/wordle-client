import {memo} from "react";
import {useI18n} from "../i18n/useI18n.ts";
import styles from "../styles/Keyboard.module.less";

export type KeyState = 'correct' | 'present' | 'absent' | undefined;

type Props = {
    onKey: (key: string) => void;
    disabled?: boolean;
    /** Map of a-z -> state to tint the keys */
    letterStates?: Record<string, KeyState>;
}

/** Physical layout in 3 rows, lower-case for lookup; we render upper-cse text */
const LAYOUT = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function KeyboardImpl({onKey, disabled, letterStates}: Props) {
    const {t} = useI18n();
    const click = (k: string) => {
        if (!disabled) onKey(k);
    }

    const keyClass = (ch: string) => {
        const st = letterStates?.[ch];
        // styles.key + optional styles.correct/present/absent
        return st ? `${styles.key} ${styles[st]}` : styles.key;
    }

    return (
        <div className={styles.keyboard} role="group" aria-label="On-screen keyboard">
            {LAYOUT.map((row, i) => (
                <div key={row} className={styles.row}>
                    {i === 2 && (
                        <button
                            type="button"
                            className={styles.special}
                            onClick={() => click('Enter')}
                            disabled={!!disabled}
                            aria-label={t('enter')}
                        >
                            {t('enter')}
                        </button>
                    )}

                    {row.split('').map((ch) => (
                        <button
                            key={ch}
                            type="button"
                            className={keyClass(ch)}
                            onClick={() => click(ch)}
                            disabled={!!disabled}
                            aria-label={ch}
                        >
                            {ch.toUpperCase()}
                        </button>
                    ))}

                    {i === 2 && (
                        <button
                            type="button"
                            className={styles.special}
                            onClick={() => click('Backspace')}
                            disabled={!!disabled}
                            aria-label={t('backspace')}
                            title="Backspace"
                        >
                            {t('backspace')}
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}

const Keyboard = memo(KeyboardImpl);
export default Keyboard;