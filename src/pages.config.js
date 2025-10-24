import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import TeamStats from './pages/TeamStats';
import SavedResults from './pages/SavedResults';
import AdminUserManager from './pages/AdminUserManager';
import Contact from './pages/Contact';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlayerStats": PlayerStats,
    "TeamStats": TeamStats,
    "SavedResults": SavedResults,
    "AdminUserManager": AdminUserManager,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};