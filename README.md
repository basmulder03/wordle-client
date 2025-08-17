# Wordle Client

<p align="left">
  <a href="https://github.com/basmulder03/wordle-client/actions/workflows/pages.yml">
    <img alt="Build" src="https://github.com/basmulder03/wordle-client/actions/workflows/pages.yml/badge.svg" />
  </a>
  <a href="https://github.com/basmulder03/wordle-client/commits/main">
    <img alt="Last Commit" src="https://img.shields.io/github/last-commit/basmulder03/wordle-client" />
  </a>
  <a href="https://github.com/basmulder03/wordle-client/tags">
    <img alt="Tag" src="https://img.shields.io/github/v/tag/basmulder03/wordle-client?label=tag&sort=semver" />
  </a>
  <a href="https://github.com/basmulder03/wordle-client/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/basmulder03/wordle-client" />
  </a>
  <a href="https://github.com/basmulder03/wordle-client/issues">
    <img alt="Open Issues" src="https://img.shields.io/github/issues/basmulder03/wordle-client" />
  </a>
  <img alt="Package Version" src="https://img.shields.io/github/package-json/v/basmulder03/wordle-client?color=blue" />
  <img alt="Renovate" src="https://img.shields.io/badge/renovate-enabled-brightgreen?logo=renovatebot" />
  <img alt="Node Version" src="https://img.shields.io/badge/node-24.x-brightgreen" />
  <img alt="Code Size" src="https://img.shields.io/github/languages/code-size/basmulder03/wordle-client" />
  <img alt="Lines of Code" src="https://img.shields.io/tokei/lines/github/basmulder03/wordle-client?label=loc" />
  <a href="https://github.com/basmulder03/wordle-client/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/basmulder03/wordle-client" /></a>
</p>

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
