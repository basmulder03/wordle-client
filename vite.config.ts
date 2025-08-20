import react from '@vitejs/plugin-react-swc'
import path from 'path'
import {fileURLToPath} from 'url'
import {defineConfig} from 'vitest/config'

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {'@': path.resolve(__dirname, 'src')}
    },
    css: {
        preprocessorOptions: {less: {javascriptEnabled: true}},
        modules: {localsConvention: 'camelCaseOnly'}
    },
    base: '/wordle-client/#/',
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        globals: true,
        passWithNoTests: false
    }
})
