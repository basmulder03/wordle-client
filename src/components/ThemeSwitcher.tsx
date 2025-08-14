import {type ChangeEvent, useState} from "react";
import {getTheme, setTheme, type ThemeMode} from "../lib/theme.ts";
import styles from '../styles/ThemeSwitcher.module.less';

export default function ThemeSwitcher() {
    const [mode, setMode] = useState<ThemeMode>(getTheme());

    function onChange(e: ChangeEvent<HTMLSelectElement>) {
        const newMode = e.target.value as ThemeMode;
        setMode(newMode);
        setTheme(newMode);
    }

    return (
        <select
            aria-label="Theme mode"
            value={mode}
            onChange={onChange}
            className={styles.select}
        >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    )
}