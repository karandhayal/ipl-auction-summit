import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { FaPlus, FaTrashAlt, FaPen, FaMoneyBillWave, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";

const GOLD = "#d4b65e";

// --- STYLES ---
const TeamsPageCSS = `
  .teams-container {
    min-height: 100vh;
    background-color: #000;
    color: #fff;
    padding: 2rem 3rem;
    font-family: sans-serif;
  }
  .teams-header {
    font-size: 2.25rem;
    font-weight: 800;
    margin-bottom: 2rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid ${GOLD};
    color: ${GOLD};
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .form-container {
    background-color: rgba(17, 24, 39, 0.8);
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    margin-bottom: 3rem;
  }
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    align-items: flex-end;
  }
  @media (min-width: 768px) {
    .form-grid {
      grid-template-columns: 2fr 1fr 1fr;
    }
  }
  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #9ca3af;
    margin-bottom: 0.25rem;
  }
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background-color: #374151;
    color: #fff;
    border: 1px solid #4b5563;
  }
  .form-button {
    background-color: ${GOLD};
    color: #000;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .form-button:hover {
    transform: scale(1.02);
  }
  .table-title {
    font-size: 1.875rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #1f2937;
  }
  .table-container {
    overflow-x: auto;
  }
  .teams-table {
    min-width: 100%;
    border-collapse: collapse;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .teams-table th, .teams-table td {
    padding: 1rem 1.5rem;
    white-space: nowrap;
  }
  .teams-table thead {
    background-color: #1f2937;
  }
  .teams-table th {
    font-size: 0.75rem;
    font-weight: 500;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .teams-table tbody {
    background-color: #111827;
    border-top: 1px solid #374151;
  }
  .teams-table tr:hover {
    background-color: #1f2937;
  }
  .action-button {
    color: #fff;
    background-color: rgba(55, 65, 81, 0.5);
    padding: 0.5rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
  }
  .action-button:hover {
    color: #60a5fa;
  }
  .delete-button:hover {
    color: #f87171;
  }
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 50;
  }
  .modal-content {
    background-color: #1f2937;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px rgba(0,0,0,0.5);
    width: 100%;
    max-width: 28rem;
  }
  .modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: ${GOLD};
  }
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .modal-button-group {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  .modal-button {
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }
  .cancel-button {
    background-color: #4b5563;
    color: #fff;
  }
  .save-button {
    background-color: ${GOLD};
    color: #000;
  }
`;

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [initialCash, setInitialCash] = useState(100000000);
  const [loading, setLoading] = useState(true);

  // State for the edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const teamsCollection = collection(db, "teams");

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(teamsCollection);
        setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Add new team
  const addTeam = async (e) => {
    e.preventDefault();
    if (teamName.trim() === "") return;
    const cashValue = Number(initialCash) || 0;
    try {
      const newTeamData = {
        name: teamName,
        cash: cashValue,
        points: 0,
        players: [],
      };
      const docRef = await addDoc(teamsCollection, newTeamData);
      setTeams([...teams, { id: docRef.id, ...newTeamData }]);
      setTeamName("");
      setInitialCash(100000000);
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  // Delete team
  const deleteTeam = async (id) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteDoc(doc(db, "teams", id));
        setTeams(teams.filter((t) => t.id !== id));
      } catch (error) {
        console.error("Error deleting team:", error);
      }
    }
  };

  // --- MODAL AND UPDATE LOGIC ---
  const openEditModal = (team) => {
    setEditingTeam({ ...team });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;
    const teamDoc = doc(db, "teams", editingTeam.id);
    const updatedData = {
      name: editingTeam.name,
      cash: Number(editingTeam.cash),
      points: Number(editingTeam.points),
    };
    try {
      await updateDoc(teamDoc, updatedData);
      setTeams(teams.map(t => t.id === editingTeam.id ? { ...t, ...updatedData } : t));
      closeModal();
    } catch (error) {
        console.error("Error updating team:", error);
        alert("Failed to update team details.");
    }
  };

  // Helper function to format money
  const formatMoney = (amount) => {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  if (loading) {
    return (
      <div className="teams-container" style={{justifyContent: 'center', alignItems: 'center', display: 'flex'}}>
        <FaMoneyBillWave style={{ fontSize: '2.25rem', color: GOLD, animation: 'spin 1s linear infinite' }} />
        <p style={{ marginLeft: '1rem', fontSize: '1.25rem' }}>Loading Teams...</p>
      </div>
    );
  }

  return (
    <>
      <style>{TeamsPageCSS}</style>
      <div className="teams-container">
        <h1 className="teams-header">
          <FaUsers />
          IPL Team Management
        </h1>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="form-container"
        >
          <h2 className="form-title">Register New Team</h2>
          <form onSubmit={addTeam} className="form-grid">
            <div style={{gridColumn: 'span 1 / span 2'}}>
              <label htmlFor="teamName" className="form-label">Team Name</label>
              <input
                id="teamName" type="text" placeholder="e.g., Chennai Super Kings"
                className="form-input"
                value={teamName} onChange={(e) => setTeamName(e.target.value)} required
              />
            </div>
            <div>
              <label htmlFor="initialCash" className="form-label">Initial Cash (INR)</label>
              <input
                id="initialCash" type="number" placeholder="e.g., 100000000"
                className="form-input"
                value={initialCash} onChange={(e) => setInitialCash(e.target.value)} required
              />
            </div>
            <button type="submit" className="form-button">
              <FaPlus style={{ marginRight: '0.5rem' }} /> Add Team
            </button>
          </form>
        </motion.div>

        <h2 className="table-title">Existing Teams ({teams.length})</h2>
        <div className="table-container">
          <table className="teams-table">
            <thead className="table-header">
              <tr>
                <th style={{textAlign: 'left'}}>Team Name</th>
                <th style={{textAlign: 'right'}}>Cash in Hand</th>
                <th style={{textAlign: 'right'}}>Points</th>
                <th style={{textAlign: 'center'}}>Players</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
              {teams.length === 0 ? (
                <tr><td colSpan="5" style={{padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '1.125rem'}}>No teams registered yet. Start by adding one above!</td></tr>
              ) : (
                teams.map((team) => (
                  <motion.tr key={team.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                    <td style={{fontSize: '1.125rem', fontWeight: 500}}>{team.name}</td>
                    <td style={{textAlign: 'right', fontFamily: 'monospace', color: GOLD }}>{formatMoney(team.cash)}</td>
                    <td style={{textAlign: 'right', fontWeight: 600}}>{team.points || 0}</td>
                    <td style={{textAlign: 'center', color: '#9ca3af'}}>{team.players ? team.players.length : 0}</td>
                    <td style={{textAlign: 'center', display: 'flex', gap: '0.75rem', justifyContent: 'center'}}>
                      <motion.button onClick={() => openEditModal(team)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="action-button" title="Edit Team Details">
                        <FaPen style={{width: '1rem', height: '1rem'}} />
                      </motion.button>
                      <motion.button onClick={() => deleteTeam(team.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="action-button delete-button" title="Remove Team">
                        <FaTrashAlt style={{width: '1rem', height: '1rem'}} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingTeam && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="modal-content">
            <h2 className="modal-title">Edit Team Details</h2>
            <div className="modal-form">
              <div>
                <label className="form-label">Team Name</label>
                <input
                  type="text" value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Cash</label>
                <input
                  type="number" value={editingTeam.cash}
                  onChange={(e) => setEditingTeam({ ...editingTeam, cash: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Points</label>
                <input
                  type="number" value={editingTeam.points || 0}
                  onChange={(e) => setEditingTeam({ ...editingTeam, points: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-button-group">
              <button onClick={closeModal} className="modal-button cancel-button">Cancel</button>
              <button onClick={handleUpdateTeam} className="modal-button save-button">Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

