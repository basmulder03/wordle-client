import {mkdirSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {
    type BuildCtx,
    type LangBuildResult,
    readPackageLicense,
    writeAttribution,
    writeManifest
} from './sources/common'
import {buildEnglish_SCOWL} from './sources/en-scowl'
import {buildDutch_OpenTaal} from './sources/nl-opentaal'

const LANGS = (process.env.LANGS || 'nl,en').split(',').map(s => s.trim()).filter(Boolean)
const LENGTHS = (process.env.LENGTHS || '4,5,6,7,8,9').split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite)
const OUT_DIR = resolve(process.cwd(), 'public/wordlists')
const nowISO = new Date().toISOString()
const projectLicense = process.env.PROJECT_LICENSE || readPackageLicense() || 'UNLICENSED'

const ctx: BuildCtx = {outDir: OUT_DIR, lengths: LENGTHS, projectLicense, nowISO}

async function maybeDownload(url: string | undefined, destPathAbs: string) {
    if (!url) return
    try {
        const res = await fetch(url)
        if (!res.ok) {
            console.warn(`Skip ${url} → HTTP ${res.status}`);
            return
        }
        const text = await res.text()
        writeFileSync(destPathAbs, text, 'utf8')
        console.log(`Saved ${destPathAbs}`)
    } catch (e) {
        console.warn(`Could not fetch ${url}:`, (e as Error).message)
    }
}

async function main() {
    mkdirSync(OUT_DIR, {recursive: true})
    const results: LangBuildResult[] = []

    for (const lang of LANGS) {
        if (lang === 'nl') {
            results.push(await buildDutch_OpenTaal(ctx))
            // Ensure OpenTaal LICENSE (dual license) is shipped
            await maybeDownload(
                'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/LICENSE.txt',
                resolve(process.cwd(), 'public', 'LICENSE.txt')
            )
        } else if (lang === 'en') {
            results.push(await buildEnglish_SCOWL(ctx))
            // Optional: ship SCOWL README/license text for clarity if provided via env
            await maybeDownload(process.env.EN_SCOWL_LICENSE_URL, resolve(process.cwd(), 'public', 'SCOWL-LICENSE.txt'))
            await maybeDownload(process.env.EN_SCOWL_README_URL, resolve(process.cwd(), 'public', 'SCOWL-README.txt'))
        } else {
            console.warn(`Unknown language '${lang}', skipping`)
        }
    }

    writeManifest(results, ctx)
    writeAttribution(results, ctx)
    console.log('✔ All done.')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
