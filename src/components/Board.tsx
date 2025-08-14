import styles from "../styles/Board.module.less";

interface BoardProps {
    rows: string[];
}

export const Board = ({rows}: BoardProps) => (
    <div className={styles.board}>
        {
            rows.map((row, i) => (
                <div key={i} className={styles.row}>
                    {row.split('').map((ch, j) => (
                        <div key={j} className={styles.cell}>{ch}</div>
                    ))}
                </div>
            ))
        }
    </div>
)