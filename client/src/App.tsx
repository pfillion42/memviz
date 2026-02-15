import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { MemoryList } from './pages/MemoryList';
import { MemoryDetail } from './pages/MemoryDetail';
import { Dashboard } from './pages/Dashboard';
import { GraphView } from './pages/GraphView';
import { Duplicates } from './pages/Duplicates';
import { Timeline } from './pages/Timeline';
import { Tags } from './pages/Tags';
import { Logo } from './components/Logo';
import { KeyboardHelp } from './components/KeyboardHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const navStyle: React.CSSProperties = {
  padding: '7px 14px',
  textDecoration: 'none',
  color: 'var(--text-muted)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.01em',
  transition: 'all var(--transition-fast)',
};

const activeStyle: React.CSSProperties = {
  ...navStyle,
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-hover)',
};

function AppContent() {
  const [showHelp, setShowHelp] = useState(false);
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp(v => !v) });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '16px 0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={30} />
          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            margin: 0,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            memviz
          </h1>
        </div>

        <nav style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
          <NavLink to="/" end style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/timeline" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Timeline
          </NavLink>
          <NavLink to="/memories" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Memoires
          </NavLink>
          <NavLink to="/duplicates" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Doublons
          </NavLink>
          <NavLink to="/tags" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Tags
          </NavLink>
          <NavLink to="/graph" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            Graphe
          </NavLink>
        </nav>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
          Memory Explorer
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/memories" element={<MemoryList />} />
          <Route path="/memories/:hash" element={<MemoryDetail />} />
          <Route path="/duplicates" element={<Duplicates />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/graph" element={<GraphView />} />
        </Routes>
      </main>

      <KeyboardHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
