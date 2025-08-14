import styles from "../styles/Keyboard.module.less";

interface KeyboardProps {
    onKey: (letter: string) => void;
}

const keys = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');

export const Keyboard = ({onKey}: KeyboardProps) => (
    <div className={styles.keyboard}>
        {keys.map(k => (
            <button key={k} className={styles.key} onClick={() => onKey(k)}>
                {k}
            </button>
        ))}
    </div>
)