import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {Readable} from 'node:stream'
import {createGunzip} from 'node:zlib'
import * as tar from 'tar'
import {bucketByLength, type BuildCtx, normalizeWords, writeLengthFiles} from './common'

type BuildOpts = {
    url?: string
    /** classes for curated "solutions" (default 10,20,35,40,50) */
    classesSolutions?: number[]
    /** classes for broad "guesses" (default adds 60,70) */
    classesGuesses?: number[]
    /** which subDirs to read */
    subDirs?: string[] // ['final/american','final/british','final/english-words']
}

/** parse class # from SCOWL filename suffix ".NN" */
function parseClassFromPath(p: string): number | null {
    const m = p.match(/\.([0-9]+)$/)
    if (!m) return null
    const n = parseInt(m[1], 10)
    return Number.isFinite(n) ? n : null
}

async function extractScowlLines(buf: Buffer, subdirs: string[], classes: Set<number>) {
    const all: string[] = []
    const debug = !!process.env.DEBUG_SCOWL
    let entryCount = 0
    let matchedCount = 0
    await new Promise<void>((resolveList, rejectList) => {
        const gunzip = createGunzip()
        // tar v7 exposes Parser (not Parse). Using any to avoid needing type.
        const extractor = new (tar as any).Parser()

        extractor.on('entry', (entry: any) => {
            entryCount++
            const p: string = String(entry.path || '')
            if (debug && (entryCount <= 30 || p.includes('final/'))) console.log('[SCOWL entry]', p)
            // Files appear as e.g. scowl-2020.12.07/final/english-words.10 (no trailing slash)
            const inSubdir = subdirs.some(sd => p.includes(sd + '/') || p.includes(sd + '.') || p.includes(sd + '\\')) || subdirs.some(sd => p.includes(sd))
            if (!inSubdir) return entry.resume()
            const cls = parseClassFromPath(p)
            if (cls == null || !classes.has(cls)) return entry.resume()
            matchedCount++
            if (debug) console.log('  -> match subdir+class', p)
            let chunk = ''
            entry.on('data', (d: Buffer) => {
                chunk += d.toString('utf8')
            })
            entry.on('end', () => {
                all.push(...chunk.split(/\r?\n/))
            })
            entry.on('error', rejectList)
        })

        extractor.on('end', () => {
            if (debug) console.log(`[SCOWL done] entries=${entryCount} matched=${matchedCount} lines=${all.length}`);
            resolveList()
        })
        extractor.on('error', rejectList)

        // Stream the in-memory buffer (tar.gz) into gunzip -> extractor
        Readable.from([buf]).pipe(gunzip).pipe(extractor)
    })
    return all
}

async function extractScowlDocs(buf: Buffer) {
    const found: Record<string, string> = {}
    const gunzip = createGunzip()
    const extractor = new (tar as any).Parser()
    await new Promise<void>((resolveDone, reject) => {
        extractor.on('entry', (entry: any) => {
            const p: string = String(entry.path || '')
            const lower = p.toLowerCase()
            const isTextCandidate = lower.endsWith('readme') || lower.endsWith('readme.txt') || lower.includes('/readme') || lower.includes('license') || lower.includes('copyright')
            if (!isTextCandidate) return entry.resume()
            let chunk = ''
            entry.on('data', (d: Buffer) => {
                chunk += d.toString('utf8')
            })
            entry.on('end', () => {
                const trimmed = chunk.trim()
                // Heuristic: prefer README that is not a script (no shebang) and contains SCOWL description
                if (lower.includes('readme')) {
                    const isScript = /^#!\//.test(trimmed)
                    const looksLikeReadme = /SCOWL|Spell Checker Oriented Word Lists/i.test(trimmed)
                    if (!found.readme && !isScript && (looksLikeReadme || trimmed.length > 200)) {
                        found.readme = trimmed
                    } else if (!found.readme && !isScript) {
                        // keep as fallback (short) if nothing better later
                        found.__readmeFallback = trimmed
                    }
                } else if ((lower.includes('license') || lower.includes('copyright')) && !found.license) {
                    found.license = trimmed
                }
            })
            entry.on('error', reject)
        })
        extractor.on('end', () => {
            // finalize fallback if needed
            if (!found.readme && found.__readmeFallback) found.readme = found.__readmeFallback
            resolveDone()
        })
        extractor.on('error', reject)
        Readable.from([buf]).pipe(gunzip).pipe(extractor)
    })
    // Write if discovered
    if (found.readme) {
        writeFileSync(resolve(process.cwd(), 'public', 'SCOWL-README.txt'), found.readme, 'utf8')
        console.log('✓ Extracted SCOWL-README.txt')
    }
    if (found.license) {
        writeFileSync(resolve(process.cwd(), 'public', 'SCOWL-LICENSE.txt'), found.license, 'utf8')
        console.log('✓ Extracted SCOWL-LICENSE.txt')
    }
}

export async function buildEnglish_SCOWL(ctx: BuildCtx, opts?: BuildOpts) {
    const url = opts?.url || process.env.EN_SCOWL_URL || 'https://netix.dl.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz?viasf=1'
    if (!url) throw new Error('EN_SCOWL_URL is required (URL to SCOWL .tar.gz)')

    const classesSol = new Set(
        opts?.classesSolutions ??
        (process.env.SCOWL_CLASSES_SOLUTIONS
            ? process.env.SCOWL_CLASSES_SOLUTIONS.split(',').map(s => parseInt(s.trim(), 10))
            : [10, 20, 35, 40, 50])
    )
    const classesGue = new Set(
        opts?.classesGuesses ??
        (process.env.SCOWL_CLASSES_GUESSES
            ? process.env.SCOWL_CLASSES_GUESSES.split(',').map(s => parseInt(s.trim(), 10))
            : [10, 20, 35, 40, 50, 60, 70])
    )
    const subDirs = opts?.subDirs || ['final/american', 'final/british', 'final/english-words']

    console.log(`SCOWL: ${url}`)
    console.log(`SCOWL solution classes: ${[...Array.from(classesSol)].join(', ')}`)
    console.log(`SCOWL guess classes:    ${[...Array.from(classesGue)].join(', ')}`)
    console.log(`SCOWL subDirs: ${subDirs.join(', ')}`)

    const res = await fetch(url, {redirect: 'follow'})
    if (!res.ok) throw new Error(`SCOWL download failed: ${res.status} ${res.statusText}`)
    const buf = Buffer.from(await res.arrayBuffer())

    // Attempt to extract README/license docs (best-effort)
    try {
        await extractScowlDocs(buf)
    } catch (e) {
        console.warn('SCOWL doc extraction failed:', (e as Error).message)
    }

    // Extract two sets (solutions vs guesses)
    const linesSol = await extractScowlLines(buf, subDirs, classesSol)
    const linesGue = await extractScowlLines(buf, subDirs, classesGue)

    console.log(`SCOWL raw lines (solutions): ${linesSol.length.toLocaleString()}`)
    console.log(`SCOWL raw lines (guesses):   ${linesGue.length.toLocaleString()}`)

    const wordsSol = normalizeWords(linesSol)
    const wordsGue = normalizeWords(linesGue)

    // Broader set should include curated terms as well
    const setSol = new Set(wordsSol)
    const mergedGue = Array.from(new Set([...wordsGue, ...wordsSol]))

    console.log(`SCOWL normalized (solutions): ${setSol.size.toLocaleString()}`)
    console.log(`SCOWL normalized (guesses):   ${mergedGue.length.toLocaleString()}`)

    const bucketsSol = bucketByLength(Array.from(setSol), ctx.lengths)
    const bucketsGue = bucketByLength(mergedGue, ctx.lengths)

    const solutions = writeLengthFiles('en', bucketsSol, ctx, 'solutions')   // writes en_5.txt
    const guesses = writeLengthFiles('en', bucketsGue, ctx, 'guesses')      // writes en_5_guesses.txt

    return {lang: 'en', sourceUrl: url, files: {solutions, guesses}}
}
