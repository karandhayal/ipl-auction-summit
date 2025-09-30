import { useState, useEffect, useCallback } from "react";
import { FaGavel, FaMoneyBillWave } from "react-icons/fa";
import { motion } from "framer-motion";

// --- FIREBASE & DATA IMPORTS ---
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { playersWithPoints } from "../playersData";

// --- CONSTANTS & STYLES ---
const GOLD = "#d4b65e";

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: 'sans-serif'
  },
  formWrapper: {
    width: '100%',
    maxWidth: '42rem',
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    border: '1px solid #27272a'
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    marginBottom: '2rem',
    color: GOLD,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  cashDisplay: {
    padding: '1rem',
    marginBottom: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.3s, border-color 0.3s'
  },
  cashDisplayError: {
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderColor: '#991b1b'
  },
  cashText: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  cashAmount: {
    fontSize: '1.875rem',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: GOLD
  },
  cashAmountError: {
    color: '#f87171'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: '0.5rem'
  },
  formSelect: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#374151',
    color: '#fff',
    border: '1px solid #4b5563',
    cursor: 'pointer',
    appearance: 'none'
  },
  formInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#374151',
    color: '#fff',
    border: '1px solid #4b5563'
  },
  suggestionsList: {
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    backgroundColor: '#374151',
    border: '1px solid #4b5563',
    borderRadius: '0.5rem',
    marginTop: '0.25rem',
    maxHeight: '10rem',
    overflowY: 'auto',
    boxShadow: '0 10px 15px rgba(0,0,0,0.2)',
    listStyle: 'none',
    padding: 0
  },
  suggestionItem: {
    padding: '0.75rem 1rem',
    color: '#fff',
    cursor: 'pointer'
  },
  errorText: {
    textAlign: 'center',
    color: '#fca5a5',
    fontWeight: '600',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: 'rgba(153, 27, 27, 0.3)',
    borderRadius: '0.5rem',
    border: '1px solid #b91c1c'
  },
  submitButton: {
    width: '100%',
    marginTop: '1.5rem',
    backgroundColor: GOLD,
    color: '#000',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer'
  }
};

// --- COMPONENT START ---
export default function BidsPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [bidError, setBidError] = useState("");

  const loadTeams = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "teams"));
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setBidError("Could not load team data.");
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const currentCash = selectedTeam ? selectedTeam.cash : 0;
  const bidValue = Number(bidAmount);

  const playerSuggestions = playersWithPoints.filter(p =>
    p.name.toLowerCase().includes(playerName.toLowerCase()) && playerName.length > 0
  );

  const formatMoney = (amount) => {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setBidError("");

    const playerToAdd = playersWithPoints.find(p => p.name === playerName);

    if (!selectedTeamId || !playerName || !bidAmount) {
      return setBidError("Please fill out all fields.");
    }
    if (!playerToAdd) {
      return setBidError("Invalid player. Please select a player from the suggestion list.");
    }
    if (bidValue <= 0 || isNaN(bidValue)) {
      return setBidError("Bid amount must be a valid positive number.");
    }
    if (bidValue > currentCash) {
      return setBidError(`Bid of ${formatMoney(bidValue)} is too high. Available cash: ${formatMoney(currentCash)}`);
    }

    const teamRef = doc(db, "teams", selectedTeamId);
    try {
      // 1. Update the team document
      await updateDoc(teamRef, {
        cash: currentCash - bidValue,
        // CRITICAL FIX: Save the full player object, not just the name
        players: arrayUnion({
            name: playerToAdd.name,
            amount: bidValue,
            points: playerToAdd.points
        }),
        points: increment(playerToAdd.points)
      });

      // 2. NEW: Log the successful bid
      await addDoc(collection(db, "bid_logs"), {
          teamName: selectedTeam.name,
          playerName: playerToAdd.name,
          bidAmount: bidValue,
          timestamp: serverTimestamp()
      });

      alert(`Bid submitted successfully! ${playerName} to ${selectedTeam.name}.`);

      setSelectedTeamId("");
      setPlayerName("");
      setBidAmount("");
      loadTeams();

    } catch (err) {
      console.error("Error submitting bid:", err);
      setBidError("Error submitting bid. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.formWrapper}
      >
        <h1 style={styles.title}>
          <FaGavel />
          Place a Strategic Bid
        </h1>

        <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{...styles.cashDisplay, ...(bidValue > currentCash && styles.cashDisplayError)}}
        >
          <p style={styles.cashText}>
            <FaMoneyBillWave style={{ color: GOLD }}/>
            Available Cash for {selectedTeam?.name || "..."}:
          </p>
          <motion.p
            key={currentCash}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{...styles.cashAmount, ...(bidValue > currentCash && styles.cashAmountError)}}
          >
            {formatMoney(currentCash)}
          </motion.p>
        </motion.div>

        <form onSubmit={handleSubmitBid} style={styles.form}>
          <div>
            <label htmlFor="team-select" style={styles.formLabel}>Select Team</label>
            <select
              id="team-select"
              style={styles.formSelect}
              value={selectedTeamId}
              onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setBidError("");
              }}
              required
            >
              <option value="" disabled>--- Choose a Team ---</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label htmlFor="player-name" style={styles.formLabel}>Player Name</label>
            <input
              id="player-name"
              type="text"
              placeholder="Start typing player name..."
              style={styles.formInput}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoComplete="off"
              required
            />
            {playerSuggestions.length > 0 && (
              <ul style={styles.suggestionsList}>
                {playerSuggestions.map((player) => (
                  <li
                    key={player.name}
                    style={styles.suggestionItem}
                    onMouseDown={() => { // use onMouseDown to fire before input loses focus
                        setPlayerName(player.name);
                        setBidError("");
                    }}
                  >
                    {player.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="bid-amount" style={styles.formLabel}>Bid Amount (INR)</label>
            <input
              id="bid-amount"
              type="number"
              placeholder="e.g., 10000000"
              style={styles.formInput}
              value={bidAmount}
              onChange={(e) => {
                  setBidAmount(e.target.value);
                  setBidError("");
              }}
              min="1"
              required
            />
          </div>

          {bidError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.errorText}
            >
              {bidError}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.submitButton}
            disabled={!selectedTeamId || !playerName || !bidAmount || bidValue > currentCash || bidValue <= 0}
          >
            <FaGavel style={{ marginRight: '0.75rem' }} />
            Submit Final Bid
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

