import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { MemoryList } from './pages/MemoryList';
import { MemoryDetail } from './pages/MemoryDetail';
import { Dashboard } from './pages/Dashboard';
import { GraphView } from './pages/GraphView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const navStyle = {
  padding: '6px 14px',
  textDecoration: 'none' as const,
  color: '#6b7280',
  borderRadius: '6px',
  fontSize: '14px',
};

const activeStyle = {
  ...navStyle,
  color: '#1d4ed8',
  backgroundColor: '#eff6ff',
  fontWeight: 600 as const,
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 24px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
            <h1 style={{ fontSize: '20px', margin: 0 }}>memviz</h1>
            <nav style={{ display: 'flex', gap: '4px' }}>
              <NavLink to="/" end style={({ isActive }) => isActive ? activeStyle : navStyle}>
                Memoires
              </NavLink>
              <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeStyle : navStyle}>
                Dashboard
              </NavLink>
              <NavLink to="/graph" style={({ isActive }) => isActive ? activeStyle : navStyle}>
                Graphe
              </NavLink>
            </nav>
          </header>

          <main>
            <Routes>
              <Route path="/" element={<MemoryList />} />
              <Route path="/memories/:hash" element={<MemoryDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/graph" element={<GraphView />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
