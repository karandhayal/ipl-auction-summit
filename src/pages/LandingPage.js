import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaGavel, FaTrophy, FaExchangeAlt } from "react-icons/fa"; // Added FaExchangeAlt for Trade page

// --- THEME & STYLES ---
const GOLD = "#d4b65e";
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    padding: '1.5rem',
    position: 'relative',
    fontFamily: 'sans-serif'
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '64rem'
  },
  mainTitle: {
    fontSize: '4.5rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    marginBottom: '1rem',
    color: GOLD,
    textAlign: 'center'
  },
  subTitle: {
    fontSize: '1.5rem',
    fontWeight: '300',
    marginBottom: '2rem',
    color: '#a0aec0',
    textAlign: 'center'
  },
  description: {
    fontSize: '1.25rem',
    color: '#d1d5db',
    marginBottom: '4rem',
    maxWidth: '48rem',
    textAlign: 'center',
    lineHeight: '1.625'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem',
    width: '100%',
    maxWidth: '64rem'
  },
  card: {
    padding: '1.5rem',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: '0.75rem',
    border: '1px solid #374151',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    width: '100%',
    textAlign: 'center'
  },
  cardIcon: {
    fontSize: '2.25rem',
    margin: '0 auto 0.75rem',
    color: GOLD
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: GOLD
  },
  cardDescription: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '1rem'
  },
  cardButton: {
    width: '100%',
    padding: '0.75rem 0',
    borderRadius: '0.5rem',
    fontWeight: '700',
    color: '#000',
    backgroundColor: GOLD,
    border: 'none',
    cursor: 'pointer'
  },
  footer: {
    position: 'absolute',
    bottom: '1.5rem',
    color: '#4b5563',
    fontSize: '0.875rem',
    fontWeight: '300',
    letterSpacing: '0.05em'
  }
};

// --- COMPONENT START ---
export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardHover = {
    y: -8,
    boxShadow: `0 10px 30px rgba(212, 182, 94, 0.4)`
  };

  return (
    <div style={styles.pageContainer}>
      <motion.div
        style={styles.contentWrapper}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} style={styles.mainTitle}>
          IPL AUCTION
        </motion.h1>

        <motion.h2 variants={itemVariants} style={styles.subTitle}>
          Your Gateway to the Grand Auction Stage
        </motion.h2>

        <motion.p variants={itemVariants} style={styles.description}>
          Manage your squad, place strategic bids, and track the live league standings in real-time. Step into the ultimate entrepreneurial IPL Auction experience.
        </motion.p>

        <div style={styles.cardGrid}>
          {/* Card for Manage Teams */}
          <motion.div variants={itemVariants} whileHover={cardHover}>
            <Link to="/teams" style={styles.card}>
              <FaUsers style={styles.cardIcon} />
              <div style={styles.cardTitle}>Manage Teams</div>
              <p style={styles.cardDescription}>View players, manage finances, and finalize your squad.</p>
              <motion.button whileTap={{ scale: 0.98 }} style={styles.cardButton}>Go to Teams</motion.button>
            </Link>
          </motion.div>

          {/* Card for Place Bids */}
          <motion.div variants={itemVariants} whileHover={cardHover}>
            <Link to="/bids" style={styles.card}>
              <FaGavel style={styles.cardIcon} />
              <div style={styles.cardTitle}>Place Bids</div>
              <p style={styles.cardDescription}>Submit and track your strategic bids on players.</p>
              <motion.button whileTap={{ scale: 0.98 }} style={styles.cardButton}>Start Bidding</motion.button>
            </Link>
          </motion.div>

          {/* Card for Live Leaderboard */}
          <motion.div variants={itemVariants} whileHover={cardHover}>
            <Link to="/leaderboard" style={styles.card}>
              <FaTrophy style={styles.cardIcon} />
              <div style={styles.cardTitle}>Live Leaderboard</div>
              <p style={styles.cardDescription}>Track real-time standings and competitor progress.</p>
              <motion.button whileTap={{ scale: 0.98 }} style={styles.cardButton}>View Ranks</motion.button>
            </Link>
          </motion.div>
          
           {/* Card for Trade Window */}
           <motion.div variants={itemVariants} whileHover={cardHover}>
            <Link to="/trade" style={styles.card}>
              <FaExchangeAlt style={styles.cardIcon} />
              <div style={styles.cardTitle}>Trade Window</div>
              <p style={styles.cardDescription}>Execute player trades and manage team compositions.</p>
              <motion.button whileTap={{ scale: 0.98 }} style={styles.cardButton}>Open Trades</motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={styles.footer}
      >
        Built for the Summit Auction • © 2025
      </motion.footer>
    </div>
  );
}
