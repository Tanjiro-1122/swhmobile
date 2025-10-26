import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import TeamStats from './pages/TeamStats';
import SavedResults from './pages/SavedResults';
import AdminPanel from './pages/AdminPanel';
import BettingCalculator from './pages/BettingCalculator';
import ROITracker from './pages/ROITracker';
import ParlayBuilder from './pages/ParlayBuilder';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlayerStats": PlayerStats,
    "TeamStats": TeamStats,
    "SavedResults": SavedResults,
    "AdminPanel": AdminPanel,
    "BettingCalculator": BettingCalculator,
    "ROITracker": ROITracker,
    "ParlayBuilder": ParlayBuilder,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};