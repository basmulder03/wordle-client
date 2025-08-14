// scripts/build-wordlists.ts
// Build length-specific Dutch word lists from the OpenTaal master list on GitHub,
// write manifest.json, download LICENSE.txt, and render ATTRIBUTION.md with
// placeholders + injected file list.
//
// Usage:
//   OPENTAAL_URL=https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/<SHA>/wordlist.txt \
//   PROJECT_LICENSE="MIT" \
//   npm run wordlists:build
//
// Notes:
// - If you don't set a SHA in OPENTAAL_URL, we extract it best-effort from the URL (last path part).
// - If public/ATTRIBUTION.template.md exists, we'll use it; otherwise we use a built-in template.

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'

type Cfg = {
    sourceUrl: string
    outDir: string
    lengths: number[]
    normalize: {
        lowercase: boolean
        stripDiacritics: boolean
        asciiOnly: boolean
        noSpaces: boolean
        noPunctuation: boolean
    }
    projectLicense: string
}

const DEFAULT_URL =
    'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt'

const cfg: Cfg = {
    sourceUrl: process.env.OPENTAAL_URL || DEFAULT_URL,
    outDir: resolve(process.cwd(), 'public/wordlists'),
    lengths: (process.env.LENGTHS || '4,5,6,7,8,9')
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => Number.isFinite(n)),
    normalize: {
        lowercase: boolFromEnv('LOWERCASE', true),
        stripDiacritics: boolFromEnv('STRIP_DIACRITICS', true),
        asciiOnly: boolFromEnv('ASCII_ONLY', true),
        noSpaces: boolFromEnv('NO_SPACES', true),
        noPunctuation: boolFromEnv('NO_PUNCTUATION', true),
    },
    projectLicense: process.env.PROJECT_LICENSE || readPackageLicense() || 'UNLICENSED'
}

function boolFromEnv(name: string, dflt: boolean) {
    const v = process.env[name];
    if (v == null) return dflt
    return /^(1|true|yes|on)$/i.test(v)
}

function readPackageLicense(): string | null {
    try {
        const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
        return pkg.license || null
    } catch {
        return null
    }
}

const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const isAZ = (s: string) => /^[a-z]+$/.test(s)

async function downloadText(url: string): Promise<string> {
    const res = await fetch(url, {redirect: 'follow'})
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`)
    return await res.text()
}

async function downloadTo(pathAbs: string, url: string) {
    const text = await downloadText(url)
    mkdirSync(dirname(pathAbs), {recursive: true})
    writeFileSync(pathAbs, text, 'utf8')
    console.log(`Saved ${pathAbs}`)
}

function extractCommitFromUrl(url: string): string {
    // try to parse .../opentaal-wordlist/<SHA>/wordlist.txt
    const parts = url.split('/')
    // look for a 7+-hex-ish segment
    const sha = parts.find(p => /^[0-9a-f]{7,}$/i.test(p))
    return sha || 'master'
}

// --- ATTRIBUTION rendering ----------------------------------------------------

const DEFAULT_ATTRIBUTION_TEMPLATE = `# Attribution

This project includes word lists derived from **OpenTaal**.

- Source: https://github.com/OpenTaal/opentaal-wordlist
- Snapshot (commit): {{OPENTAAL_COMMIT_SHA}}
- Fetched from: {{OPENTAAL_URL}}
- Generated: {{GENERATED_AT_ISO}}

Derived files (in \`public/wordlists/\`):
{{GENERATED_FILES}}

## License (OpenTaal)

OpenTaal distributes its word list under a **dual license**. You may choose **either**:
- **BSD 3-Clause License**, or
- **Creative Commons Attribution 3.0 (CC BY 3.0)**

We retain OpenTaal’s license file (\`LICENSE.txt\`) in this distribution.
© OpenTaal — see \`LICENSE.txt\` for full terms.

### Transformations applied
- Lowercased all entries
- Removed spaces/punctuation/hyphens
- {{DIACRITICS_NOTE}}
- Split into length-specific subsets

---

## Project license

This application's own code and assets are licensed separately from the OpenTaal data.
Project license: **{{PROJECT_LICENSE}}**.

`

function renderAttribution(opts: {
    url: string
    commit: string
    generatedAtISO: string
    counts: Record<string, number>
    projectLicense: string
    diacriticsStripped: boolean
    templatePath?: string
}) {
    const template = opts.templatePath && existsSync(opts.templatePath)
        ? readFileSync(opts.templatePath, 'utf8')
        : DEFAULT_ATTRIBUTION_TEMPLATE

    const filesList = Object.entries(opts.counts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, count]) => `- \`${file}\` — ${count.toLocaleString()} words`)
        .join('\n')

    return template
        .replace(/{{OPENTAAL_COMMIT_SHA}}/g, opts.commit)
        .replace(/{{OPENTAAL_URL}}/g, opts.url)
        .replace(/{{GENERATED_AT_ISO}}/g, opts.generatedAtISO)
        .replace(/{{PROJECT_LICENSE}}/g, opts.projectLicense)
        .replace(/{{GENERATED_FILES}}/g, filesList || '- *(none)*')
        .replace(/{{DIACRITICS_NOTE}}/g, opts.diacriticsStripped ? 'Stripped diacritics' : 'Kept diacritics')
}

// --- MAIN --------------------------------------------------------------------

async function main() {
    mkdirSync(cfg.outDir, {recursive: true})
    console.log(`→ Downloading OpenTaal master list:\n   ${cfg.sourceUrl}`)
    const raw = await downloadText(cfg.sourceUrl)
    const lines = raw.split(/\r?\n/)
    console.log(`→ Master lines: ${lines.length.toLocaleString()}`)

    // normalize & filter
    let filtered = lines.map(s => s.trim()).filter(Boolean)
    if (cfg.normalize.noSpaces) filtered = filtered.filter(w => !w.includes(' '))
    if (cfg.normalize.lowercase) filtered = filtered.map(w => w.toLowerCase())
    if (cfg.normalize.stripDiacritics) filtered = filtered.map(stripDiacritics)
    if (cfg.normalize.noPunctuation) filtered = filtered.filter(w => /^[a-z]+$/.test(w))
    if (cfg.normalize.asciiOnly) filtered = filtered.filter(isAZ)

    console.log(`→ After filtering: ${filtered.length.toLocaleString()} words`)

    // buckets & files
    const counts: Record<string, number> = {}
    for (const L of cfg.lengths) {
        const set = Array.from(new Set(filtered.filter(w => w.length === L))).sort()
        const file = resolve(cfg.outDir, `nl_${L}.txt`)
        writeFileSync(file, set.join('\n'), 'utf8')
        counts[`nl_${L}.txt`] = set.length
        console.log(`✓ Wrote nl_${L}.txt  (${set.length.toLocaleString()} words)`)
    }

    // manifest
    const manifest = {
        source: cfg.sourceUrl,
        license: '/LICENSE.txt',
        counts,
        options: cfg,
        generatedAt: new Date().toISOString()
    }
    writeFileSync(resolve(cfg.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
    console.log('✓ Wrote manifest.json')

    // license file (OpenTaal)
    const licenseDest = resolve(process.cwd(), 'public', 'LICENSE.txt')
    await downloadTo(licenseDest, 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/LICENSE.txt')

    // attribution (render with injection)
    const attributionDest = resolve(process.cwd(), 'public', 'ATTRIBUTION.md')
    const attributionTemplate = resolve(process.cwd(), 'public', 'ATTRIBUTION.template.md') // optional
    const commit = extractCommitFromUrl(cfg.sourceUrl)
    const attribution = renderAttribution({
        url: cfg.sourceUrl,
        commit,
        generatedAtISO: manifest.generatedAt,
        counts,
        projectLicense: cfg.projectLicense,
        diacriticsStripped: cfg.normalize.stripDiacritics,
        templatePath: attributionTemplate
    })
    writeFileSync(attributionDest, attribution, 'utf8')
    console.log(`✓ Wrote ${attributionDest}`)
}

main().catch(err => {
    console.error('✗ Build failed:', err)
    process.exit(1)
})
