import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { FaExchangeAlt, FaHistory } from "react-icons/fa";

// --- THEME & STYLES ---
const GOLD = "#d4b65e";
const TradePageCSS = `
  .trade-container {
    min-height: 100vh;
    background-color: #000;
    color: #fff;
    font-family: sans-serif;
    padding: 2rem;
  }
  .trade-content {
    max-width: 900px;
    margin: 0 auto;
  }
  .trade-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  .trade-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: ${GOLD};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
  .form-section, .log-section {
    background-color: rgba(17, 24, 39, 0.8);
    border: 1px solid #374151;
    border-radius: 0.75rem;
    padding: 2rem;
  }
  .log-section {
    margin-top: 2rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: end;
  }
  .form-group {
    display: flex;
    flex-direction: column;
  }
  .form-label {
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #a0aec0;
  }
  .form-input, .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background-color: #1f2937;
    color: #fff;
    border: 1px solid #4b5563;
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: ${GOLD};
    box-shadow: 0 0 0 3px rgba(212, 182, 94, 0.3);
  }
  .trade-button {
    grid-column: 1 / -1; /* Span full width */
    padding: 1rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #000;
    background-color: ${GOLD};
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  .trade-button:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
  }
  .trade-button:not(:disabled):hover {
    background-color: #c5a653;
    transform: translateY(-2px);
  }
  .log-header {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${GOLD};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .log-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .log-item {
    background-color: #1f2937;
    padding: 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }
  .log-item p {
    margin: 0;
  }
  .log-item .highlight {
    color: ${GOLD};
    font-weight: 600;
  }
`;

// --- COMPONENT START ---
export default function TradePage() {
  const [teams, setTeams] = useState([]);
  const [tradeLogs, setTradeLogs] = useState([]);
  const [bidLogs, setBidLogs] = useState([]); // NEW: State to store auction bid logs for validation
  const [loading, setLoading] = useState(true);

  // Form state
  const [fromTeamId, setFromTeamId] = useState('');
  const [toTeamId, setToTeamId] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');

  // UI Feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch teams and all logs in real-time
  useEffect(() => {
    const teamsQuery = query(collection(db, "teams"), orderBy("name"));
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const tradeLogsQuery = query(collection(db, "trade_logs"), orderBy("timestamp", "desc"), limit(10));
    const unsubscribeTradeLogs = onSnapshot(tradeLogsQuery, (snapshot) => {
        setTradeLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // NEW: Fetch all bid logs to verify player ownership
    const bidLogsQuery = query(collection(db, "bid_logs"));
    const unsubscribeBidLogs = onSnapshot(bidLogsQuery, (snapshot) => {
        setBidLogs(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubscribeTeams();
      unsubscribeTradeLogs();
      unsubscribeBidLogs(); // Unsubscribe from the new listener
    };
  }, []);

  const fromTeam = teams.find(t => t.id === fromTeamId);
  const toTeam = teams.find(t => t.id === toTeamId);
  const selectedPlayer = fromTeam?.players?.find(p => p.name === selectedPlayerName);

  const resetForm = () => {
      setFromTeamId('');
      setToTeamId('');
      setSelectedPlayerName('');
      setTradeAmount('');
      setError('');
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    setError('');

    // --- Basic Validation ---
    if (!fromTeamId || !toTeamId || !selectedPlayerName || !tradeAmount) {
      return setError("All fields are required.");
    }
    if (fromTeamId === toTeamId) {
      return setError("A team cannot trade with itself.");
    }
    const amount = parseInt(tradeAmount, 10);
    if (isNaN(amount) || amount < 0) {
        return setError("Please enter a valid, non-negative trade amount.");
    }
    if (!toTeam || toTeam.cash < amount) {
        return setError(`${toTeam.name} does not have enough cash for this trade.`);
    }
    if (!fromTeam || !selectedPlayer) {
        return setError("Selected player not found in the selling team.");
    }

    // --- NEW: Ownership Verification Logic ---
    // Find the original purchase record for the selected player from the auction logs.
    const originalBid = bidLogs.find(log => log.playerName === selectedPlayerName);

    if (!originalBid) {
        return setError(`Ownership of ${selectedPlayerName} could not be verified in auction logs. Trade is denied.`);
    }

    if (originalBid.teamName !== fromTeam.name) {
        return setError(`${fromTeam.name} is not the original owner. ${originalBid.teamName} bought ${selectedPlayerName} in the auction and only they can trade this player for cash.`);
    }

    setIsProcessing(true);
    
    // --- Firestore Transaction ---
    try {
      await runTransaction(db, async (transaction) => {
        const fromTeamRef = doc(db, "teams", fromTeamId);
        const toTeamRef = doc(db, "teams", toTeamId);

        const fromTeamDoc = await transaction.get(fromTeamRef);
        const toTeamDoc = await transaction.get(toTeamRef);

        if (!fromTeamDoc.exists() || !toTeamDoc.exists()) {
          throw new Error("One of the teams does not exist.");
        }

        const fromTeamData = fromTeamDoc.data();
        const toTeamData = toTeamDoc.data();

        // Update seller (fromTeam)
        transaction.update(fromTeamRef, {
          cash: fromTeamData.cash + amount,
          players: fromTeamData.players.filter(p => p.name !== selectedPlayerName),
          points: fromTeamData.points - (selectedPlayer.points || 0)
        });

        // Update buyer (toTeam)
        transaction.update(toTeamRef, {
          cash: toTeamData.cash - amount,
          players: [...toTeamData.players, selectedPlayer],
          points: toTeamData.points + (selectedPlayer.points || 0)
        });
      });

      // --- Log the trade ---
      await addDoc(collection(db, "trade_logs"), {
          fromTeam: fromTeam.name,
          toTeam: toTeam.name,
          player: selectedPlayer.name,
          amount: amount,
          points: selectedPlayer.points,
          timestamp: serverTimestamp()
      });
      
      resetForm();

    } catch (err) {
      console.error("Trade failed:", err);
      setError("Transaction failed. Please check the data and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="trade-container"><p>Loading team data...</p></div>

  return (
    <>
      <style>{TradePageCSS}</style>
      <div className="trade-container">
        <div className="trade-content">
          <header className="trade-header">
            <h1 className="trade-title"><FaExchangeAlt /> Player Trade Window</h1>
          </header>

          <section className="form-section">
            <form onSubmit={handleTrade} className="form-grid">
              {/* From Team */}
              <div className="form-group">
                <label className="form-label">Team Selling Player</label>
                <select className="form-select" value={fromTeamId} onChange={e => setFromTeamId(e.target.value)}>
                  <option value="">-- Select Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Player to Trade */}
              <div className="form-group">
                <label className="form-label">Player to Trade</label>
                <select className="form-select" value={selectedPlayerName} onChange={e => setSelectedPlayerName(e.target.value)} disabled={!fromTeamId}>
                  <option value="">-- Select Player --</option>
                  {fromTeam?.players?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              {/* To Team */}
              <div className="form-group">
                <label className="form-label">Team Buying Player</label>
                <select className="form-select" value={toTeamId} onChange={e => setToTeamId(e.target.value)}>
                  <option value="">-- Select Team --</option>
                  {teams.filter(t => t.id !== fromTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Trade Amount */}
              <div className="form-group">
                <label className="form-label">Cash Amount (INR)</label>
                <input type="number" className="form-input" placeholder="e.g., 5000000" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} />
              </div>

              <button type="submit" className="trade-button" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Execute Trade'}
              </button>
              
              {error && <p style={{ color: '#f87171', gridColumn: '1 / -1', textAlign: 'center' }}>{error}</p>}
            </form>
          </section>

          <section className="log-section">
              <h2 className="log-header"><FaHistory/> Recent Trades</h2>
              <ul className="log-list">
                  {tradeLogs.length > 0 ? tradeLogs.map(log => (
                      <li key={log.id} className="log-item">
                          <p>
                              <span className="highlight">{log.fromTeam}</span> traded <span className="highlight">{log.player}</span> to <span className="highlight">{log.toTeam}</span> for <span className="highlight">₹{log.amount.toLocaleString('en-IN')}</span>
                          </p>
                      </li>
                  )) : <p style={{color: '#a0aec0'}}>No recent trades to show.</p>}
              </ul>
          </section>
        </div>
      </div>
    </>
  );
}

