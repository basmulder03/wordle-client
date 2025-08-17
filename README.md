# Wordle Client

A Wordle game client built with React, TypeScript, and Vite. Supports multiple languages and themes.

## Features

- Play Wordle in your browser
- Multiple word lengths and languages
- Theme switcher (light/dark)
- Local storage for game state
- Responsive design

## Getting Started

### Install dependencies

```
pnpm install
```

### Run in development mode

```
pnpm run dev
```

### Build for production

```
pnpm run build
```

## Project Structure

- `src/` — Main source code
    - `components/` — UI components (Board, Keyboard, etc.)
    - `hooks/` — Custom React hooks
    - `i18n/` — Internationalization
    - `lib/` — Utility libraries (storage, theme, wordlist)
    - `screens/` — Page components
    - `styles/` — LESS styles
    - `types/` — TypeScript types
- `public/wordlists/` — Word lists for different languages and lengths
- `scripts/` — Utility scripts for wordlists

## Credits

- Dutch word lists: [OpenTaal](https://opentaal.org/) (see `public/OpenTaal-LICENSE.txt`)
- English word lists: SCOWL (public domain; extracted docs `SCOWL-README.txt` / `SCOWL-LICENSE.txt` if available)
- See aggregated attribution in `public/ATTRIBUTION.md`

## License

Application code is under the project license declared in `package.json`.
Third‑party word list licenses are shipped separately:

- `public/OpenTaal-LICENSE.txt`
- `public/SCOWL-LICENSE.txt` (if extracted)
- `public/SCOWL-README.txt` (if extracted)
- `public/ATTRIBUTION.md`
