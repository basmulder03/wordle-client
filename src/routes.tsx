import {BrowserRouter as Router, Link, Route, Routes} from "react-router";
import App from "./App.tsx";
import {useI18n} from "./i18n/useI18n.ts";
import About from "./screens/About.tsx";
import styles from './styles/App.module.less';

function Nav() {
    const {t} = useI18n();
    return (
        <nav className={styles.header} style={{marginBottom: 0}}>
            <Link to="/">{t('home')}</Link>
            <Link to="/about">{t('about')}</Link>
        </nav>
    )
}

const base
    = import.meta.env.BASE_URL || '/';

export default function AppRoutes() {
    return (
        <Router basename={base}>
            <Nav/>
            <Routes>
                <Route path="/" element={<App/>}/>
                <Route path="/about" element={<About/>}/>
            </Routes>
        </Router>
    )
}