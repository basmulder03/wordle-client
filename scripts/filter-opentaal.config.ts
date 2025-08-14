export default {
    // Location of the OpenTaal wordlist
    sourceUrl: 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt',
    // Output directory for the filtered wordlists
    // This should be relative to the project root
    outDir: 'public/wordlists',
    // Which lengths to filter
    lengths: [4, 5, 6, 7, 8, 9],
    // Text normalization & filtering options
    normalize: {
        lowercase: true, // Convert all words to lowercase
        stripDiacritics: true, // Remove diacritics (accents, umlauts, etc.)
        asciiOnly: true, // Keep only ASCII characters
        noSpaces: true, // drop entries containing spaces
        noPunctuation: true, // drop entries containing punctuation
        noNumbers: true, // drop entries containing numbers
    }
} as const;