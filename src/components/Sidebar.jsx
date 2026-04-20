import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, IndianRupee,
  FileText, Package, ShieldAlert, Phone, MessageSquare
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', id: 'sidebar-dashboard' },
];

const tripItems = [
  { icon: Map,          label: 'Itinerary',   key: 'itinerary',  id: 'sidebar-itinerary' },
  { icon: IndianRupee,   label: 'Budget',      key: 'budget',     id: 'sidebar-budget' },
  { icon: FileText,     label: 'Documents',   key: 'documents',  id: 'sidebar-documents' },
  { icon: Package,      label: 'Packing',     key: 'packing',    id: 'sidebar-packing' },
  { icon: ShieldAlert,  label: 'Risk Flags',  key: 'risks',      id: 'sidebar-risks' },
  { icon: Phone,        label: 'Emergency',   key: 'emergency',  id: 'sidebar-emergency' },
  { icon: MessageSquare,label: 'Comments',    key: 'comments',   id: 'sidebar-comments' },
];

/**
 * Sidebar — collapsible side navigation for trip sections.
 * When inside a trip, it shows trip-specific section links.
 */
const Sidebar = ({ tripId, activeTab, onTabChange, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const inTrip = !!tripId;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="sidebar-overlay" 
            onClick={onMobileClose} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <motion.div 
          className="sidebar-inner"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Main nav */}
          <div className="sidebar-section">
            <motion.p variants={itemVariants} className="sidebar-label">MAIN</motion.p>
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <motion.div key={item.to} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={item.to}
                    id={item.id}
                    className={`sidebar-item ${active ? 'active' : ''}`}
                    onClick={onMobileClose}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    {active && <motion.span layoutId="active-indicator" className="active-indicator" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Trip Sections (only when inside a trip) */}
          {inTrip && (
            <div className="sidebar-section">
              <motion.p variants={itemVariants} className="sidebar-label">TRIP SECTIONS</motion.p>
              {tripItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <motion.div key={item.key} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      id={item.id}
                      className={`sidebar-item ${active ? 'active' : ''}`}
                      onClick={() => { onTabChange(item.key); onMobileClose?.(); }}
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                      {active && <motion.span layoutId="active-indicator-trip" className="active-indicator" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <style>{`
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.6);
            z-index: 799;
          }
          .sidebar {
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            bottom: 0;
            width: var(--sidebar-width);
            background: var(--bg-surface);
            border-right: 1px solid var(--border-subtle);
            overflow-y: auto;
            z-index: 800;
            transition: transform var(--transition-slow);
          }
          .sidebar-inner { padding: 1.25rem 0.75rem; }
          .sidebar-section { margin-bottom: 2rem; }
          .sidebar-label {
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            padding: 0 0.75rem;
            margin-bottom: 0.5rem;
          }
          .sidebar-item {
            display: flex;
            align-items: center;
            gap: 0.7rem;
            padding: 0.65rem 0.75rem;
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            background: none;
            border: none;
            width: 100%;
            text-align: left;
            font-family: 'Inter', sans-serif;
            transition: all var(--transition-fast);
            position: relative;
            margin-bottom: 2px;
          }
          .sidebar-item:hover {
            background: var(--bg-elevated);
            color: var(--text-primary);
          }
          .sidebar-item.active {
            background: rgba(20,184,166,0.1);
            color: var(--teal-400);
          }
          .active-indicator {
            position: absolute;
            right: 0.5rem;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--teal-400);
          }

          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar-open {
              transform: translateX(0);
            }
            .sidebar-open + .sidebar-overlay,
            .sidebar-overlay { display: block; }
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;
