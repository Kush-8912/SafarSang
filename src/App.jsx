import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTripContext } from './context/TripContext';
import { FullPageSpinner } from './components/ui/Spinner';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// ─── Lazy-loaded pages for code splitting (React.lazy + Suspense) ─────────────
const Login       = lazy(() => import('./pages/Auth/Login'));
const Signup      = lazy(() => import('./pages/Auth/Signup'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const CreateTrip  = lazy(() => import('./pages/CreateTrip'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const NotFound    = lazy(() => import('./pages/NotFound'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const Profile     = lazy(() => import('./pages/Profile/Profile'));
const Settings    = lazy(() => import('./pages/Profile/Settings'));

// ─── Authenticated app shell (Navbar + Sidebar + page content) ────────────────
const AppLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeTab, setActiveTab } = useTripContext();

  // Detect if we are inside a trip to show trip-specific sidebar items
  const tripMatch = location.pathname.match(/^\/trips\/([^/]+)$/);
  const tripId = (tripMatch && tripMatch[1] !== 'new') ? tripMatch[1] : null;

  return (
    <div className="app-layout">
      <Navbar
        onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="main-layout">
        <Sidebar
          tripId={tripId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <main
          className="page-content"
          style={{ marginLeft: 'var(--sidebar-width)' }}
          id="main-content"
        >
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/trips/new"     element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
              <Route path="/trips/:tripId" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// ─── Inner router — must live inside BrowserRouter ────────────────────────────
const InnerRouter = () => {
  const { isAuthenticated, loading, error } = useAuth();

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', padding: '2rem', textAlign: 'center', background: 'var(--bg-base)'
      }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--coral-400)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ color: 'var(--coral-400)', marginBottom: '1rem' }}>Firebase Configuration Missing</h2>
          <p style={{ color: 'var(--text-primary)', maxWidth: '500px', lineHeight: 1.6 }}>
            {error}
          </p>
          <hr style={{ borderColor: 'var(--border-default)', margin: '1.5rem 0' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Open <code>src/services/firebase.js</code> and paste your actual Firebase project configurations.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <FullPageSpinner />;

  return (
    <TripProvider>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"  element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

          {/* Authenticated shell — handles all other routes including /dashboard, /trips/* */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Suspense>
    </TripProvider>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InnerRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
