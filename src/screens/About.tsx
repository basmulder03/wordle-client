import {useEffect, useState} from "react";
import {useDateFmt} from "../i18n/dates.ts";
import {useI18n} from "../i18n/useI18n.ts";
import {getAllowedLengths, loadManifest, localeToPrefix} from "../lib/wordlist.ts";
import styles from '../styles/About.module.less';

type CountsRow = { file: string; count: number; }

const BASE = import.meta.env.BASE_URL || '/';

export default function About() {
    const {t, lang} = useI18n();
    const {formatDate} = useDateFmt();
    const [lengths, setLengths] = useState<number[]>([]);
    const [counts, setCounts] = useState<CountsRow[]>([]);
    const [source, setSource] = useState<string>('');
    const [generatedAt, setGeneratedAt] = useState<string>('');

    useEffect(() => {
        (async () => {
            const m = await loadManifest();
            setLengths(getAllowedLengths(lang, m));
            if (m?.counts) {
                const prefix = localeToPrefix(lang);
                const rows: CountsRow[] = Object.entries(m.counts)
                    .filter(([file]) => file.startsWith(`${prefix}_`))
                    .map(([file, count]) => ({file, count}))
                    .sort((a, b) => a.file.localeCompare(b.file));
                setCounts(rows);
            } else {
                setCounts([]);
            }
            setSource(m?.source ?? '');
            setGeneratedAt(m?.generatedAt ?? '');
        })();
    }, [lang]);

    return (
        <article className={styles.about}>
            <h1>{t('about')}</h1>

            <section className={styles.card}>
                <h2>{t('attribution')}</h2>
                <p>
                    {t('attributionText')}{' '}
                    <a href={`${BASE}wordlists/manifest.json`} target="_blank" rel="noreferrer">manifest.json</a>.
                    {t('attributionLicense')}
                </p>
                <ul className={styles.links}>
                    <li><a href={`${BASE}ATTRIBUTION.md`} target="_blank" rel="noreferrer">ATTRIBUTION.md</a></li>
                    <li><a href={`${BASE}LICENSE.txt`} target="_blank" rel="noreferrer">LICENSE.txt</a></li>
                </ul>

                <dl className={styles.meta}>
                    {source && (<>
                        <dt>{t('source')}</dt>
                        <dd><a href={source} target="_blank" rel="noreferrer">{source}</a></dd>
                    </>)}
                    {generatedAt && (
                        <>
                            <dt>{t('generated')}</dt>
                            <dd>{formatDate(generatedAt)}</dd>
                        </>
                    )}
                    <dt>{t('availableLengths')}</dt>
                    <dd>{lengths.length ? lengths.join(', ') : '-'}</dd>
                </dl>
            </section>

            <section className={styles.card}>
                <h2>{t('tech')}</h2>
                <p>Vite · React · TypeScript · Less Modules · LocalStorage · i18n</p>
                {!!counts.length && (
                    <>
                        <h3 className={styles.sub}>{t('files')}</h3>
                        <table className={styles.table} aria-label="Wordlist files and counts">
                            <thead>
                            <tr>
                                <th>File</th>
                                <th>Count</th>
                            </tr>
                            </thead>
                            <tbody>
                            {counts.map(r => (
                                <tr key={r.file}>
                                    <td><a href={`${BASE}wordlists/${r.file}`} target="_blank"
                                           rel="noreferrer">{r.file}</a></td>
                                    <td>{r.count.toLocaleString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>
                )}
            </section>

            <p className={styles.back}><a href='#/'>{t('backHome')}</a></p>
        </article>
    )
}