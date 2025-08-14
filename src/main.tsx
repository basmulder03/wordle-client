import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {I18nProvider} from "./i18n";

// Import the global styles before component CSS modules
import './styles/globals.less';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <I18nProvider>
            <App/>
        </I18nProvider>
    </StrictMode>,
)
