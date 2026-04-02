import { useState } from 'react';
import { Grid2X2, List, Plus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AgentCard from './AgentCard';
import AgentConfigDrawer from './AgentConfigDrawer';
import CreateAgentModal from './CreateAgentModal';
import ProbeAgentModal from './ProbeAgentModal';
import ConfirmDialog from './ConfirmDialog';
import { agentsApi, type Agent } from '../api/agents';
import { useNotification } from '../hooks/useNotification';

const AgentFleet = () => {
  const { notifySuccess, notifyApiError } = useNotification();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProbeModalOpen, setIsProbeModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await agentsApi.findAll();
      return data;
    },
  });

  const invalidateAgents = () => queryClient.invalidateQueries({ queryKey: ['agents'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      notifySuccess('Agent Inactivated', 'Neural node has been marked as inactive.');
      setIsConfirmOpen(false);
      invalidateAgents();
    },
    onError: (error) => notifyApiError(error, 'Operation Failed'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => agentsApi.update(id, { status: 'active' }),
    onSuccess: () => {
      notifySuccess('Neural Link Restored', 'The agent has been reactivated and synchronized.');
      invalidateAgents();
    },
    onError: (error) => notifyApiError(error, 'Activation Failed'),
  });

  const handleConfigure = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDrawerOpen(true);
  };

  const handleProbe = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsProbeModalOpen(true);
  };

  const handleDeleteRequest = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedAgent) return;
    deleteMutation.mutate(selectedAgent.id);
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-white">Agent Fleet</h2>
          <p className="text-on-surface-variant mt-2 font-body text-sm">
            Commanding <span className="text-secondary font-bold">{agents.filter(a => a.status !== 'inactive').length}</span> active neural nodes across the network.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-container-high text-white' : 'text-on-surface-variant hover:text-white'}`}
          >
            <Grid2X2 size={20} aria-hidden="true" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-surface-container-high text-white' : 'text-on-surface-variant hover:text-white'}`}
          >
            <List size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {agents.map((agent) => (
            <div key={agent.id} onClick={() => handleConfigure(agent)} className={agent.status === 'inactive' ? 'opacity-50 grayscale hover:grayscale-0 transition-all' : ''}>
              <AgentCard 
                id={agent.id}
                name={agent.name}
                expertise={agent.role || 'General Assistant'}
                model={agent.model?.name || 'Unknown'}
                status={agent.status || 'active'}
                metricLabel="Provider"
                metricValue={agent.provider?.name || 'Unknown'}
                onConfigure={() => handleConfigure(agent)}
                onProbe={() => handleProbe(agent)}
                onDelete={() => handleDeleteRequest(agent)}
                onActivate={() => handleActivate(agent.id)}
              />
            </div>
          ))}
          
          {/* New Agent Placeholder */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-primary" />
            </div>
            <span className="text-sm font-bold font-headline text-on-surface-variant group-hover:text-on-surface">Deploy New Agent</span>
            <p className="text-xs text-on-surface-variant/60 mt-1 max-w-[200px]">Expand your fleet with specialized intelligence units.</p>
          </div>
        </div>
      )}

      <AgentConfigDrawer 
        key={selectedAgent?.id || 'none'}
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onUpdated={invalidateAgents}
        agent={selectedAgent} 
      />

      <ProbeAgentModal 
        isOpen={isProbeModalOpen}
        onClose={() => setIsProbeModalOpen(false)}
        agent={selectedAgent}
      />

      <CreateAgentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={invalidateAgents}
      />

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Decommission Neural Node?"
        message={`This will mark ${selectedAgent?.name} as inactive. The agent will remain in the database but will no longer be available for automated tasks or direct neural connection.`}
        confirmText="Decommission"
        variant="danger"
      />
    </div>
  );
};

export default AgentFleet;
