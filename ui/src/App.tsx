import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './layout/Shell';
import AgentFleet from './components/AgentFleet';
import Providers from './pages/Providers';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationModal from './components/NotificationModal';
import NotificationInterceptor from './components/NotificationInterceptor';

const Home = () => (
  <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 space-y-4">
    <div className="w-24 h-24 rounded-3xl bg-surface-container-high flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-dashed border-outline-variant/30 animate-spin-slow"></div>
    </div>
    <span className="text-sm font-headline tracking-widest uppercase">Select a node from the workspace</span>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <NotificationInterceptor />
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agents" element={<AgentFleet />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/flow" element={<div className="text-on-surface-variant font-mono">FLOW_BUILDER_CANVAS</div>} />
            <Route path="/scheduler" element={<div className="text-on-surface-variant font-mono">SCHEDULER_CORE</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
      <NotificationModal />
    </NotificationProvider>
  );
}

export default App;
