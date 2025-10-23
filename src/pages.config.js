import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import TeamStats from './pages/TeamStats';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlayerStats": PlayerStats,
    "TeamStats": TeamStats,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};