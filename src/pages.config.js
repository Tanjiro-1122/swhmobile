import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import TeamStats from './pages/TeamStats';
import SavedResults from './pages/SavedResults';
import AdminUserManager from './pages/AdminUserManager';
import Contact from './pages/Contact';
import SystemHealthCheck from './pages/SystemHealthCheck';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccuracyTracker from './pages/AccuracyTracker';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlayerStats": PlayerStats,
    "TeamStats": TeamStats,
    "SavedResults": SavedResults,
    "AdminUserManager": AdminUserManager,
    "Contact": Contact,
    "SystemHealthCheck": SystemHealthCheck,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "AccuracyTracker": AccuracyTracker,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};