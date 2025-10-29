import Dashboard from './pages/Dashboard';
import PlayerStats from './pages/PlayerStats';
import TeamStats from './pages/TeamStats';
import SavedResults from './pages/SavedResults';
import AdminPanel from './pages/AdminPanel';
import BettingCalculator from './pages/BettingCalculator';
import ROITracker from './pages/ROITracker';
import ParlayBuilder from './pages/ParlayBuilder';
import LiveOdds from './pages/LiveOdds';
import Alerts from './pages/Alerts';
import Community from './pages/Community';
import LearningCenter from './pages/LearningCenter';
import BankrollManager from './pages/BankrollManager';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Pricing from './pages/Pricing';
import PowerUser from './pages/PowerUser';
import BettingBriefs from './pages/BettingBriefs';
import Profile from './pages/Profile';
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
    "LiveOdds": LiveOdds,
    "Alerts": Alerts,
    "Community": Community,
    "LearningCenter": LearningCenter,
    "BankrollManager": BankrollManager,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "Pricing": Pricing,
    "PowerUser": PowerUser,
    "BettingBriefs": BettingBriefs,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};