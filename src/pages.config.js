import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlayerStats": PlayerStats,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};