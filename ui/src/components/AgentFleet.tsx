import { useState, useEffect } from 'react';
import { Grid2X2, List, Plus, Loader2 } from 'lucide-react';
import AgentCard from './AgentCard';
import AgentConfigDrawer from './AgentConfigDrawer';
import { agentsApi, type Agent } from '../api/agents';

const AgentFleet = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data } = await agentsApi.findAll();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-white">Agent Fleet</h2>
          <p className="text-on-surface-variant mt-2 font-body text-sm">
            Commanding <span className="text-secondary font-bold">12</span> active neural nodes across the network.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded bg-surface-container-high text-on-surface-variant hover:text-white transition-colors">
            <Grid2X2 size={20} />
          </button>
          <button className="p-2 rounded text-on-surface-variant hover:text-white transition-colors">
            <List size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} onClick={() => {
              setSelectedAgent(agent);
              setIsDrawerOpen(true);
            }}>
              <AgentCard 
                name={agent.name}
                expertise={agent.role || 'General Assistant'}
                model={agent.modelId}
                status={(agent.status as any) || 'active'}
                metricLabel="Provider"
                metricValue={agent.provider}
              />
            </div>
          ))}
          
          {/* New Agent Placeholder */}
          <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5">
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-primary" />
            </div>
            <span className="text-sm font-bold font-headline text-on-surface-variant group-hover:text-on-surface">Deploy New Agent</span>
            <p className="text-xs text-on-surface-variant/60 mt-1 max-w-[200px]">Expand your fleet with specialized intelligence units.</p>
          </div>
        </div>
      )}

      <AgentConfigDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        agent={selectedAgent} 
      />
    </div>
  );
};

export default AgentFleet;
