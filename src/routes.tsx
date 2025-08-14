import {BrowserRouter, Link, Route, Routes} from 'react-router'
import App from './App'
import {useI18n} from './i18n/useI18n'
import About from './screens/About'
import nav from './styles/Nav.module.less'

function Nav() {
    const {t} = useI18n()
    return (
        <header className={nav.nav} role="navigation" aria-label="Primary">
            <div className={nav.wrap}>
                <div className={nav.links}>
                    <Link to="/">{t('home')}</Link>
                    <Link to="/about">{t('about')}</Link>
                </div>
                <div className={nav.actions}>
                    {/* space for theme/lang toggles if needed */}
                </div>
            </div>
        </header>
    )
}

export default function AppRoutes() {
    // dynamic basename keeps local dev working at "/" and Pages at "/wordle-client/"
    const base = import.meta.env.BASE_URL || '/'
    return (
        <BrowserRouter basename={base}>
            <Nav/>
            <Routes>
                <Route path="/" element={<App/>}/>
                <Route path="/about" element={<About/>}/>
            </Routes>
        </BrowserRouter>
    )
}
