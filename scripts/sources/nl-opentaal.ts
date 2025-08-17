import {bucketByLength, type BuildCtx, DEFAULT_NORMALIZE, normalizeWords, writeLengthFiles} from './common'

export async function buildDutch_OpenTaal(
    ctx: BuildCtx,
    opts?: { url?: string; normalize?: Partial<typeof DEFAULT_NORMALIZE> }
) {
    const url = opts?.url || process.env.OPENTAAL_URL ||
        'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt'

    const res = await fetch(url, {redirect: 'follow'})
    if (!res.ok) throw new Error(`OpenTaal download failed: ${res.status} ${res.statusText}`)
    const raw = await res.text()
    const lines = raw.split(/\r?\n/)
    console.log(`OpenTaal lines: ${lines.length.toLocaleString()}`)

    const words = normalizeWords(lines, {...DEFAULT_NORMALIZE, ...(opts?.normalize || {})})
    console.log(`OpenTaal normalized: ${words.length.toLocaleString()}`)

    // For NL we use the same set for solutions & guesses by default.
    const buckets = bucketByLength(words, ctx.lengths)
    const solutions = writeLengthFiles('nl', buckets, ctx, 'solutions')
    const guesses = writeLengthFiles('nl', buckets, ctx, 'guesses') // extra files nl_5_guesses.txt etc.

    const result = {lang: 'nl', sourceUrl: url, files: {solutions, guesses}}
    return result
}
