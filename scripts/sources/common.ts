import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'

export type NormalizeOpts = {
    lowercase: boolean
    stripDiacritics: boolean
    asciiOnly: boolean
    noSpaces: boolean
    noPunctuation: boolean
}

export type BuildCtx = {
    outDir: string
    lengths: number[]
    projectLicense: string
    nowISO: string
}

export type Counts = Record<string, number>

export type LangBuildResult = {
    lang: 'nl' | 'en' | string
    sourceUrl: string
    files: {
        solutions: Counts
        guesses: Counts
    }
}

export const DEFAULT_NORMALIZE: NormalizeOpts = {
    lowercase: true,
    stripDiacritics: true,
    asciiOnly: true,
    noSpaces: true,
    noPunctuation: true,
}

export function stripDiacritics(s: string) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const isAZ = (s: string) => /^[a-z]+$/.test(s)

export function normalizeWords(lines: string[], o: NormalizeOpts = DEFAULT_NORMALIZE): string[] {
    let w = lines.map(s => s.trim()).filter(Boolean)
    if (o.noSpaces) w = w.filter(x => !x.includes(' '))
    if (o.lowercase) w = w.map(x => x.toLowerCase())
    if (o.stripDiacritics) w = w.map(stripDiacritics)
    if (o.noPunctuation) w = w.filter(isAZ)
    if (o.asciiOnly) w = w.filter(isAZ)
    return w
}

export function bucketByLength(words: string[], lengths: number[]) {
    const buckets = new Map<number, Set<string>>()
    for (const L of lengths) buckets.set(L, new Set<string>())
    for (const w of words) {
        const L = w.length
        if (buckets.has(L)) buckets.get(L)!.add(w)
    }
    return buckets
}

/** write files like: en_5.txt (or en_5_guesses.txt if suffix provided) */
export function writeLengthFiles(
    langPrefix: string,
    buckets: Map<number, Set<string>>,
    ctx: BuildCtx,
    suffix?: 'solutions' | 'guesses'
): Counts {
    mkdirSync(ctx.outDir, {recursive: true})
    const counts: Counts = {}
    for (const [L, set] of Array.from(buckets.entries())) {
        const arr = Array.from(set).sort()
        const fname = `${langPrefix}_${L}_${suffix}.txt`
        const file = resolve(ctx.outDir, fname)
        writeFileSync(file, arr.join('\n'), 'utf8')
        counts[fname] = arr.length
        console.log(`✓ Wrote ${fname} (${arr.length.toLocaleString()} words)`)
    }
    return counts
}

/** merge two flat counts objects */
export function mergeCounts(into: Counts, more: Counts) {
    for (const [k, v] of Object.entries(more)) into[k] = v
}

export function readPackageLicense(): string | null {
    try {
        const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
        return pkg.license || null
    } catch {
        return null
    }
}

/** Modern manifest (plus legacy counts) */
export function writeManifest(
    results: LangBuildResult[],
    ctx: BuildCtx
) {
    const countsLegacy: Counts = {}
    const sources = results.map(r => ({lang: r.lang, url: r.sourceUrl}))
    const lengthsByLang: Record<string, number[]> = {}
    const files: Record<string, { solutions: Counts; guesses: Counts }> = {}

    for (const r of results) {
        files[r.lang] = {solutions: r.files.solutions, guesses: r.files.guesses}
        lengthsByLang[r.lang] = Object.keys(r.files.solutions)
            .map(k => k.match(/_(\d+)/)?.[1]).filter(Boolean).map(n => parseInt(n!, 10))
            .sort((a, b) => a - b)
        // legacy: flatten both sets into single map (so old code keeps working)
        for (const [f, c] of Object.entries(r.files.solutions)) countsLegacy[f] = c
        for (const [f, c] of Object.entries(r.files.guesses)) countsLegacy[f] = c
    }

    const manifest = {
        version: 2,
        generatedAt: ctx.nowISO,
        sources,             // [{lang,url}]
        lengthsByLang,       // { en:[4,5,6,7], nl:[4,5,6,7] }
        files,               // per-lang, per-tier counts
        counts: countsLegacy // legacy flat map
    }

    writeFileSync(resolve(ctx.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
    console.log('✓ Wrote manifest.json (v2)')
}

const DEFAULT_ATTRIBUTION_TEMPLATE = `# Attribution

This project includes word lists derived from:

{{SOURCES_LIST}}

Generated: {{GENERATED_AT_ISO}}

Derived files (in \`public/wordlists/\`):
{{GENERATED_FILES}}

## Notes
- Dutch: OpenTaal — dual-licensed (BSD 3-Clause or CC BY 3.0). See \`LICENSE.txt\`.
- English: SCOWL — public domain. You may include SCOWL README/license for clarity.

## Project license
This application's code/assets are licensed separately from wordlists.
Project license: **{{PROJECT_LICENSE}}**.
`

export function renderAttribution(
    results: LangBuildResult[],
    nowISO: string,
    projectLicense: string,
    templatePath?: string
) {
    const template = templatePath && existsSync(templatePath)
        ? readFileSync(templatePath, 'utf8')
        : DEFAULT_ATTRIBUTION_TEMPLATE

    const srcList = results.map(r => `- ${r.lang.toUpperCase()}: ${r.sourceUrl}`).join('\n')

    const filesList = results.flatMap(r => {
        const sol = Object.entries(r.files.solutions).map(([f, c]) => `- \`${f}\` — ${c.toLocaleString()} words (solutions)`)
        const gue = Object.entries(r.files.guesses).map(([f, c]) => `- \`${f}\` — ${c.toLocaleString()} words (guesses)`)
        return [...sol, ...gue]
    }).sort((a, b) => a.localeCompare(b)).join('\n')

    return template
        .replace('{{SOURCES_LIST}}', srcList)
        .replace('{{GENERATED_FILES}}', filesList || '- *(none)*')
        .replace('{{GENERATED_AT_ISO}}', nowISO)
        .replace('{{PROJECT_LICENSE}}', projectLicense)
}

export function writeAttribution(
    results: LangBuildResult[],
    ctx: BuildCtx
) {
    const dest = resolve(process.cwd(), 'public', 'ATTRIBUTION.md')
    const template = resolve(process.cwd(), 'public', 'ATTRIBUTION.template.md') // optional
    mkdirSync(dirname(dest), {recursive: true})
    const md = renderAttribution(results, ctx.nowISO, ctx.projectLicense, template)
    writeFileSync(dest, md, 'utf8')
    console.log(`✓ Wrote ${dest}`)
}
