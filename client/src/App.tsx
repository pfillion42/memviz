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
import { Stale } from './pages/Stale';
import { EmbeddingView } from './pages/EmbeddingView';
import { ClusterView } from './pages/ClusterView';
import { Logo } from './components/Logo';
import { KeyboardHelp } from './components/KeyboardHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

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
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
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
            {t('nav_dashboard')}
          </NavLink>
          <NavLink to="/timeline" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_timeline')}
          </NavLink>
          <NavLink to="/memories" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_memories')}
          </NavLink>
          <NavLink to="/duplicates" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_duplicates')}
          </NavLink>
          <NavLink to="/tags" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_tags')}
          </NavLink>
          <NavLink to="/stale" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_stale')}
          </NavLink>
          <NavLink to="/embeddings" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_embeddings')}
          </NavLink>
          <NavLink to="/clusters" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_clusters')}
          </NavLink>
          <NavLink to="/graph" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            {t('nav_graph')}
          </NavLink>
        </nav>

        <button
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          aria-label="Toggle language"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            padding: '6px 10px',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '6px 10px',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
          <Route path="/stale" element={<Stale />} />
          <Route path="/embeddings" element={<EmbeddingView />} />
          <Route path="/clusters" element={<ClusterView />} />
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
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
