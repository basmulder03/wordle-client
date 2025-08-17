import {useEffect, useMemo, useState} from 'react'
import {useDateFmt} from '../i18n/dates'
import {useI18n} from '../i18n/useI18n'
import {currentWordlistUrl, getAllowedLengths, loadManifest, localeToPrefix, type ManifestV2,} from '../lib/wordlist'
import s from '../styles/About.module.less'

type Row = { length: number; solutions?: number; guesses?: number }

const BASE = import.meta.env.BASE_URL || '/'

export default function About() {
    const {t, lang} = useI18n()
    const {formatDate} = useDateFmt()
    const [m, setM] = useState<ManifestV2 | null>(null)
    const [rows, setRows] = useState<Row[]>([])
    const [sourceLines, setSourceLines] = useState<string[]>([])

    const prefix = useMemo(() => localeToPrefix(lang), [lang])

    useEffect(() => {
        (async () => {
            const manifest = await loadManifest()
            setM(manifest)

            // Build per-length rows for this language from v2 (preferred) or fallback to legacy counts
            const lengths = getAllowedLengths(lang, manifest)
            const byLen: Record<number, Row> = {}
            lengths.forEach(L => (byLen[L] = {length: L}))

            if (manifest?.files?.[prefix]) {
                const {solutions, guesses} = manifest.files[prefix]
                for (const [file, count] of Object.entries(solutions || {})) {
                    const match = file.match(/_(\d+)(?:\.txt)$/);
                    if (!match) continue
                    const L = parseInt(match[1], 10);
                    if (!byLen[L]) byLen[L] = {length: L}
                    byLen[L].solutions = count
                }
                for (const [file, count] of Object.entries(guesses || {})) {
                    const match = file.match(/_(\d+)_guesses\.txt$/);
                    if (!match) continue
                    const L = parseInt(match[1], 10);
                    if (!byLen[L]) byLen[L] = {length: L}
                    byLen[L].guesses = count
                }
            } else {
                // legacy fallback: scan flat counts
                const reSol = new RegExp(`^${prefix}_(\\d+)\\.txt$`)
                const reGue = new RegExp(`^${prefix}_(\\d+)_guesses\\.txt$`)
                for (const [file, count] of Object.entries(manifest?.counts || {})) {
                    let m
                    if ((m = file.match(reSol))) {
                        const L = parseInt(m[1], 10);
                        if (!byLen[L]) byLen[L] = {length: L}
                        byLen[L].solutions = count
                    } else if ((m = file.match(reGue))) {
                        const L = parseInt(m[1], 10);
                        if (!byLen[L]) byLen[L] = {length: L}
                        byLen[L].guesses = count
                    }
                }
            }

            setRows(Object.values(byLen).sort((a, b) => a.length - b.length))

            if (Array.isArray(manifest?.sources)) {
                setSourceLines(manifest.sources.map(s => `${s.lang.toUpperCase()}: ${s.url}`))
            } else {
                setSourceLines([])
            }
        })()
    }, [lang, prefix])

    const generatedAt = m?.generatedAt ? formatDate(m.generatedAt) : ''

    return (
        <article className={s.about}>
            <h1>{t('about')}</h1>

            <section className={s.card}>
                <h2>{t('attribution')}</h2>
                <p>
                    {t('attributionText')}{' '}
                    <a href={`${BASE}wordlists/manifest.json`} target="_blank" rel="noreferrer">manifest.json</a>.
                    {t('attributionLicense')}
                </p>
                <ul className={s.links}>
                    <li><a href={`${BASE}ATTRIBUTION.md`} target="_blank" rel="noreferrer">ATTRIBUTION.md</a></li>
                    <li><a href={`${BASE}LICENSE.txt`} target="_blank" rel="noreferrer">LICENSE.txt</a></li>
                    {/* SCOWL docs are optional; show if present */}
                    <li><a href={`${BASE}SCOWL-LICENSE.txt`} target="_blank" rel="noreferrer">SCOWL-LICENSE.txt</a></li>
                    <li><a href={`${BASE}SCOWL-README.txt`} target="_blank" rel="noreferrer">SCOWL-README.txt</a></li>
                </ul>

                <dl className={s.meta}>
                    {!!sourceLines.length && (<>
                        <dt>{t('source')}</dt>
                        <dd>
                            {sourceLines.map((line, i) => (
                                <div key={i}><a href={line.split(': ').at(-1)} target="_blank"
                                                rel="noreferrer">{line}</a></div>
                            ))}
                        </dd>
                    </>)}
                    {generatedAt && (<>
                        <dt>{t('generated')}</dt>
                        <dd>{generatedAt}</dd>
                    </>)}
                    <dt>{t('availableLengths')}</dt>
                    <dd>{rows.length ? rows.map(r => r.length).join(', ') : '—'}</dd>
                </dl>
            </section>

            <section className={s.card}>
                <h2>{t('files')}</h2>
                <table className={s.table} aria-label="Wordlist counts per length and tier">
                    <thead>
                    <tr>
                        <th>{t('length')}</th>
                        <th>{t('solutions')}</th>
                        <th>{t('guesses')}</th>
                        <th>{t('files')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map(r => {
                        const solHref = currentWordlistUrl(lang, r.length, 'solutions')
                        const gueHref = currentWordlistUrl(lang, r.length, 'guesses')
                        return (
                            <tr key={r.length}>
                                <td>{r.length}</td>
                                <td>{r.solutions?.toLocaleString() ?? '—'}</td>
                                <td>{r.guesses?.toLocaleString() ?? '—'}</td>
                                <td className={s.fileLinks}>
                                    <a href={solHref} target="_blank" rel="noreferrer">{`${prefix}_${r.length}.txt`}</a>
                                    {r.guesses != null && (
                                        <>
                                            {' · '}
                                            <a href={gueHref} target="_blank"
                                               rel="noreferrer">{`${prefix}_${r.length}_guesses.txt`}</a>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </section>

            <p className={s.back}><a href={`${BASE}#/`}>{t('backHome')}</a></p>
        </article>
    )
}
