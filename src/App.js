import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TeamsPage from "./pages/TeamsPage";
import TradePage from "./pages/TradePage";
import BidsPage from "./pages/BidsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/bids" element={<BidsPage />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </Router>
  );
}
