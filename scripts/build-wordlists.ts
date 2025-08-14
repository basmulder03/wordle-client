// Build length specific Dutch word lists from the OpenTaal master list on Github.
//
// Usage:
//   npm run wordlist:build
//
// Env overrides (all optional):
//   OPENTAAL_URL=https://.../wordlist.txt
//   OUT_DIR=public/wordlists
//   LENGTHS=4,5,6,7,8,9
//   LOWERCASE=true|false
//   STRIP_DIACRITICS=true|false
//   ASCII_ONLY=true|false
//   NO_SPACES=true|false
//   NO_PUNCTUATION=true|false

import {mkdirSync, writeFileSync} from 'fs';
import {resolve} from 'path';

type Cfg = {
    sourceUrl: string;
    outDir: string;
    lengths: number[];
    normalize: {
        lowercase: boolean;
        stripDiacritics: boolean;
        asciiOnly: boolean;
        noSpaces: boolean;
        noPunctuation: boolean;
        noNumbers: boolean;
    };
}

// Load optional local config file (no crash if missing)
async function loadLocalConfig(): Promise<Partial<Cfg>> {
    try {
        const mod = await import('./filter-opentaal.config.js') as Partial<Cfg>;
        return mod || {};
    } catch {
        console.warn('No local config found, using defaults');
        return {};
    }
}

const boolFromEnv = (name: string, defaultValue: boolean): boolean => {
    const v = process.env[name];
    if (v == null) return defaultValue;
    return /^(1|true|yes|on)$/i.test(v);
}

const arrayFromEnv = (name: string, defaultValue: number[]) => {
    const v = process.env[name];
    if (v == null) return defaultValue;
    return v.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
}

const stripDiacritics = (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const isAZ = (str: string) => /^[a-z]+$/.test(str);

async function downloadText(url: string): Promise<string> {
    const res = await fetch(url, {redirect: 'follow'});
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return res.text();
}

async function main() {
    const local = await loadLocalConfig();

    const cfg: Cfg = {
        sourceUrl: process.env.OPENTAAL_URL || local.sourceUrl || 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt',
        outDir: process.env.OUT_DIR || local.outDir || 'public/wordlists',
        lengths: arrayFromEnv('LENGTHS', local.lengths || [4, 5, 6, 7, 8, 9]),
        normalize: {
            lowercase: boolFromEnv('LOWERCASE', local.normalize?.lowercase ?? true),
            stripDiacritics: boolFromEnv('STRIP_DIACRITICS', local.normalize?.stripDiacritics ?? true),
            asciiOnly: boolFromEnv('ASCII_ONLY', local.normalize?.asciiOnly ?? true),
            noSpaces: boolFromEnv('NO_SPACES', local.normalize?.noSpaces ?? true),
            noPunctuation: boolFromEnv('NO_PUNCTUATION', local.normalize?.noPunctuation ?? true),
            noNumbers: boolFromEnv('NO_NUMBERS', local.normalize?.noNumbers ?? true),
        }
    }

    mkdirSync(cfg.outDir, {recursive: true});
    console.log(`Downloading wordlist from ${cfg.sourceUrl}`);
    const raw = await downloadText(cfg.sourceUrl);
    const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    console.log(`Loaded ${lines.length} lines from the wordlist`);

    // Normalize & filter words
    let filtered = lines
        .map(s => s.trim())
        .filter(Boolean);

    if (cfg.normalize.noSpaces) filtered = filtered.filter(s => !s.includes(' '));
    if (cfg.normalize.lowercase) filtered = filtered.map(s => s.toLowerCase());
    if (cfg.normalize.stripDiacritics) filtered = filtered.map(stripDiacritics);
    if (cfg.normalize.noPunctuation) filtered = filtered.filter(s => /[a-zA-Z]/.test(s));
    if (cfg.normalize.noNumbers) filtered = filtered.filter(s => isAZ(s));

    console.log(`Filtered down to ${filtered.length} words after normalization`);

    // Group by length
    const buckets = new Map<number, Set<string>>();
    for (const L of cfg.lengths) buckets.set(L, new Set<string>());
    for (const w of filtered) {
        const L = w.length;
        if (buckets.has(L)) buckets.get(L)!.add(w);
    }

    // Write files
    const counts: Record<string, number> = {};
    for (const L of cfg.lengths) {
        const arr = Array.from(buckets.get(L)!).sort();
        const fileName = `nl_${L}.txt`
        const file = resolve(cfg.outDir, fileName);
        counts[fileName] = arr.length;
        writeFileSync(file, arr.join('\n') + '\n', 'utf8');
        console.log(`Wrote ${arr.length} words of length ${L} to ${file}`);
    }

    // Manifest + metadata
    const manifest = {
        source: cfg.sourceUrl,
        license: '/LICENSE.txt',
        counts,
        options: cfg,
        generatedAt: new Date().toISOString()
    };
    writeFileSync(resolve(cfg.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Wrote manifest.json with ${cfg.lengths.length} lengths`);
}

main().catch(err => {
    console.error('Error building wordlist:', err);
    process.exit(1);
})