import React, {useEffect, useState} from 'react'
import {useI18n} from '../i18n'
import {getAllowedLengths, loadManifest} from '../lib/wordlist'
import s from '../styles/About.module.less'

export default function About() {
    const {t, lang} = useI18n()
    const [lengths, setLengths] = useState<number[]>([])

    useEffect(() => {
        (async () => {
            const m = await loadManifest()
            setLengths(getAllowedLengths(lang, m))
        })()
    }, [lang])

    return (
        <article className={s.about}>
            <h1>{t('about')}</h1>
            <section>
                <h2>{t('attribution')}</h2>
                <p>{t('attributionText')} OpenTaal. {t('attributionLicense')}</p>
                <p><strong>{t('length')}:</strong> {lengths.join(', ')}</p>
            </section>
        </article>
    )
}
