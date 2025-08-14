import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {I18nProvider} from "./i18n";

// Import the global styles before component CSS modules
import './styles/globals.less';
import {initTheme} from "./lib/theme.ts";
import AppRoutes from "./routes.tsx";

initTheme()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <I18nProvider>
            <AppRoutes/>
        </I18nProvider>
    </StrictMode>,
)
