import {HashRouter, Link, Route, Routes} from "react-router";
import ThemeSwitcher from "./components/ThemeSwitcher.tsx";
import {useI18n} from './i18n/useI18n'
import About from './screens/About'
import App from './screens/App.tsx'
import nav from './styles/Nav.module.less'
import page from './styles/Page.module.less'

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
                    <ThemeSwitcher/>
                </div>
            </div>
        </header>
    )
}

export default function AppRoutes() {
    return (
        <HashRouter>
            <div className={page.page}>
                <Nav/>
                <div className={page.content}>
                    <Routes>
                        <Route path="/" element={<App/>}/>
                        <Route path="/about" element={<About/>}/>
                    </Routes>
                </div>
            </div>
        </HashRouter>
    )
}
