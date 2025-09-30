import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaMoneyBillWave, FaChevronDown, FaHistory } from "react-icons/fa";

// --- THEME CONSTANT ---
const GOLD = "#d4b65e";

// --- LEADERBOARD COMPONENT ---
export default function LeaderboardPage() {
  const [teams, setTeams] = useState([]);
  const [bidLogs, setBidLogs] = useState([]); // State to hold all bid logs
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    // Listener for teams, ordered by points
    const teamsQuery = query(collection(db, "teams"), orderBy("points", "desc"));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching real-time team data:", error);
      setLoading(false);
    });

    // Listener for all bid logs, ordered by time
    const bidLogsQuery = query(collection(db, "bid_logs"), orderBy("timestamp", "desc"));
    const unsubscribeLogs = onSnapshot(bidLogsQuery, (snapshot) => {
        setBidLogs(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
        unsubscribeTeams();
        unsubscribeLogs();
    };
  }, []);

  // --- HELPER FUNCTION ---
  const formatMoney = (amount) => {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const LeaderboardCSS = `
    .leaderboard-container {
      min-height: 100vh;
      background-color: #000;
      color: #fff;
      font-family: sans-serif;
      padding: 2rem;
    }
    .leaderboard-content {
      max-width: 1024px;
      margin: 0 auto;
    }
    .leaderboard-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .leaderboard-logo {
      margin: 0 auto 1.5rem;
      height: 8rem; /* Increased logo size */
    }
    .leaderboard-title {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: ${GOLD};
    }
    .leaderboard-subtitle {
      color: #a0aec0;
      margin-top: 0.5rem;
      font-size: 1.125rem;
    }
    .team-row {
      background-color: rgba(17, 24, 39, 0.8);
      border: 1px solid #374151;
      border-radius: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      transition: border-color 0.3s;
    }
    .team-row:hover {
      border-color: rgba(212, 182, 94, 0.5);
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 1rem;
      align-items: center;
    }
    .team-rank {
      grid-column: span 1;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      color: ${GOLD};
    }
    .team-name {
      grid-column: span 5;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .team-stat {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .team-points {
      grid-column: span 2;
    }
    .team-cash {
      grid-column: span 3;
    }
    .team-stat .icon {
      margin-right: 0.5rem;
    }
    .team-stat .value {
      font-size: 1.125rem;
    }
    .team-points .value {
      font-weight: 700;
    }
    .team-cash .value {
      font-family: monospace;
    }
    .chevron-container {
      grid-column: span 1;
      text-align: center;
    }
    .log-details {
      background-color: rgba(31, 41, 55, 0.5);
      border-radius: 0 0 0.5rem 0.5rem;
      overflow: hidden;
      padding: 0 1.5rem 1rem;
    }
    .log-content {
      border-top: 1px solid #4b5563;
      padding-top: 1rem;
      margin-top: 0.5rem;
    }
    .log-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: ${GOLD};
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .log-list-header {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1rem;
      padding: 0.5rem;
      font-weight: 600;
      color: #a0aec0;
      border-bottom: 1px solid #4b5563;
      margin-bottom: 0.5rem;
    }
    .log-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .log-item {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1rem;
      align-items: center;
      background-color: rgba(17, 24, 39, 0.5);
      padding: 0.5rem;
      border-radius: 0.25rem;
    }
    .log-player {
      font-weight: 500;
      text-align: left;
    }
    .log-amount {
      font-family: monospace;
      color: #4ade80;
      text-align: right;
    }
  `;

  return (
    <>
      <style>{LeaderboardCSS}</style>
      <div className="leaderboard-container">
        <div className="leaderboard-content">
          <header className="leaderboard-header">
            <img src="/summitchapters.png" alt="Summit Chapters Logo" className="leaderboard-logo"/>
            <h1 className="leaderboard-title">IPL AUCTION LEADERBOARD</h1>
            <p className="leaderboard-subtitle">Live Standings</p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <p style={{ textAlign: 'center', fontSize: '1.25rem' }}>Loading Leaderboard...</p>
            ) : (
              teams.map((team, index) => {
                // Filter bid logs for the current team being rendered
                const teamBidLogs = bidLogs.filter(log => log.teamName === team.name);

                return (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <div
                      className="team-row"
                      onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                    >
                      <div className="team-grid">
                        <div className="team-rank">{index + 1}</div>
                        <div className="team-name">{team.name}</div>
                        <div className="team-stat team-points">
                          <FaTrophy className="icon" style={{ color: GOLD }} />
                          <span className="value">{team.points || 0}</span>
                        </div>
                        <div className="team-stat team-cash">
                          <FaMoneyBillWave className="icon" style={{ color: '#4ade80' }} />
                          <span className="value">{formatMoney(team.cash)}</span>
                        </div>
                        <div className="chevron-container">
                            <motion.div animate={{ rotate: expandedTeamId === team.id ? 180 : 0 }}>
                                <FaChevronDown />
                            </motion.div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedTeamId === team.id && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="log-details"
                        >
                          <div className="log-content">
                            <h3 className="log-title"><FaHistory /> Bid History ({teamBidLogs.length})</h3>
                            {teamBidLogs.length > 0 ? (
                               <>
                                <div className="log-list-header">
                                  <span style={{ textAlign: 'left' }}>Player</span>
                                  <span style={{ textAlign: 'right' }}>Bid Amount</span>
                                </div>
                                <ul className="log-list">
                                    {teamBidLogs.map((log, logIndex) => (
                                        <li key={`${log.playerName}-${logIndex}`} className="log-item">
                                            <span className="log-player">{log.playerName}</span>
                                            <span className="log-amount">{formatMoney(log.bidAmount)}</span>
                                        </li>
                                    ))}
                                </ul>
                               </>
                            ) : (
                                <p style={{ color: '#a0aec0' }}>No successful bids recorded for this team.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

