import AIAssistant from './pages/AIAssistant';
import AIParlayBuilder from './pages/AIParlayBuilder';
import AIPerformance from './pages/AIPerformance';
import AdminErrorLogs from './pages/AdminErrorLogs';
import AdminPanel from './pages/AdminPanel';
import AdminPurchaseAudit from './pages/AdminPurchaseAudit';
import Alerts from './pages/Alerts';
import AnalysisHub from './pages/AnalysisHub';
import appleauthcallbackTsx from './pages/AppleAuthCallback.tsx';
import BankrollManager from './pages/BankrollManager';
import BettingBriefs from './pages/BettingBriefs';
import BettingCalculator from './pages/BettingCalculator';
import BettingHub from './pages/BettingHub';
import Community from './pages/Community';
import CommunityHub from './pages/CommunityHub';
import ContactUs from './pages/ContactUs';
import DailyBriefs from './pages/DailyBriefs';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Index from './pages/Index';
import LearningCenter from './pages/LearningCenter';
import LiveOdds from './pages/LiveOdds';
import MyAccount from './pages/MyAccount';
import MyInsights from './pages/MyInsights';
import ParlayBuilder from './pages/ParlayBuilder';
import PlayerStats from './pages/PlayerStats';
import PostPurchaseSignIn from './pages/PostPurchaseSignIn';
import PowerUser from './pages/PowerUser';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import ROITracker from './pages/ROITracker';
import SavedResults from './pages/SavedResults';
import SportDetail from './pages/SportDetail';
import SportsNewsTicker from './pages/SportsNewsTicker';
import TeamStats from './pages/TeamStats';
import TermsOfService from './pages/TermsOfService';
import TopStats from './pages/TopStats';
import TopTen from './pages/TopTen';
import UserPreferences from './pages/UserPreferences';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AIParlayBuilder": AIParlayBuilder,
    "AIPerformance": AIPerformance,
    "AdminErrorLogs": AdminErrorLogs,
    "AdminPanel": AdminPanel,
    "AdminPurchaseAudit": AdminPurchaseAudit,
    "Alerts": Alerts,
    "AnalysisHub": AnalysisHub,
    "AppleAuthCallback.tsx": appleauthcallbackTsx,
    "BankrollManager": BankrollManager,
    "BettingBriefs": BettingBriefs,
    "BettingCalculator": BettingCalculator,
    "BettingHub": BettingHub,
    "Community": Community,
    "CommunityHub": CommunityHub,
    "ContactUs": ContactUs,
    "DailyBriefs": DailyBriefs,
    "Dashboard": Dashboard,
    "Home": Home,
    "Index": Index,
    "LearningCenter": LearningCenter,
    "LiveOdds": LiveOdds,
    "MyAccount": MyAccount,
    "MyInsights": MyInsights,
    "ParlayBuilder": ParlayBuilder,
    "PlayerStats": PlayerStats,
    "PostPurchaseSignIn": PostPurchaseSignIn,
    "PowerUser": PowerUser,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "ROITracker": ROITracker,
    "SavedResults": SavedResults,
    "SportDetail": SportDetail,
    "SportsNewsTicker": SportsNewsTicker,
    "TeamStats": TeamStats,
    "TermsOfService": TermsOfService,
    "TopStats": TopStats,
    "TopTen": TopTen,
    "UserPreferences": UserPreferences,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};