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

- Word lists from [OpenTaal](https://opentaal.org/) and other sources (see `public/ATTRIBUTION.md`)

## License

See `public/LICENSE.txt` for details.
