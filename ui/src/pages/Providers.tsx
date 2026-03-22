import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  RefreshCcw, 
  Plus, 
  ChevronRight,
  Monitor,
  Database,
  Copy,
  Eye,
  RotateCw,
  MoreVertical,
  Terminal,
  Server
} from 'lucide-react';
import RegisterProviderModal from '../components/RegisterProviderModal';
import CreateModelModal from '../components/CreateModelModal';
import { providersApi, type Provider } from '../api/providers';
import { type Model } from '../api/models';

const Providers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const provider = providers.find(p => p.id === selectedProvider);
  const providerModels = models;

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await providersApi.findAll();
      setProviders(res.data);
      if (res.data.length > 0 && !selectedProvider) {
        setSelectedProvider(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  const fetchModelsForProvider = async (providerId: string) => {
    try {
      setIsLoadingModels(true);
      const res = await providersApi.findModels(providerId);
      setModels(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (selectedProvider) {
      fetchModelsForProvider(selectedProvider);
    }
  }, [selectedProvider]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-primary font-bold">
              <span className="opacity-60">Infrastructure</span>
              <ChevronRight size={12} className="opacity-40" />
              <span>Model Providers</span>
            </nav>
            <h1 className="text-4xl font-extrabold font-headline tracking-tighter text-white">Provider Core</h1>
            <p className="text-on-surface-variant text-sm mt-1">Manage global LLM integrations and endpoint health.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchProviders}
              disabled={loading}
              className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/10 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Register Provider
            </button>
          </div>
        </div>
      </header>

      {/* Bento Grid: Health & Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Activity size={80} strokeWidth={1} />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50 mb-6">Total Request Volume</h3>
          <div className="flex items-end gap-5">
            <span className="text-5xl font-headline font-black text-white tracking-tighter">2.4M</span>
            <span className="text-secondary text-xs font-bold mb-2 flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={14} /> +12%
            </span>
          </div>
          <div className="mt-8 flex gap-1.5 h-12 items-end opacity-40">
            {[30, 50, 20, 70, 40, 90, 60, 45, 80, 55, 30, 40].map((h, i) => (
              <div 
                key={i} 
                className="w-full bg-secondary rounded-t-sm transition-all duration-1000" 
                style={{ height: `${h}%`, opacity: (i + 1) / 12 }} 
              />
            ))}
          </div>
        </div>
        
        <div className="bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50">Global Uptime</h3>
            <div className="mt-2">
              <span className="text-3xl font-headline font-black text-secondary">99.98%</span>
              <p className="text-[9px] text-on-surface-variant/40 mt-1 uppercase font-bold tracking-widest">Aggregated Network Score</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group hover:border-tertiary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-4 group-hover:scale-110 transition-transform">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50">Avg. Latency</h3>
            <div className="mt-2">
              <span className="text-3xl font-headline font-black text-tertiary">342ms</span>
              <p className="text-[9px] text-on-surface-variant/40 mt-1 uppercase font-bold tracking-widest">P95 Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Providers List */}
        <div className="lg:col-span-4 space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 flex items-center gap-3">
            <Server size={14} className="text-primary" /> Active Providers
          </h2>
          
          <div className="space-y-3">
            {providers.length > 0 ? providers.map((p) => {
              const isSelected = selectedProvider === p.id;
              // Placeholder stats for the UI
              const stats = {
                models: 0, // In a real app we'd fetch relationships
                status: 'Healthy',
                color: 'text-secondary',
                bg: 'bg-secondary'
              };
              
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all duration-300 group ${
                    isSelected 
                      ? 'bg-surface-container-high border-secondary/20 shadow-lg shadow-secondary/5 ring-1 ring-secondary/10 text-white' 
                      : 'bg-surface-container-low border-transparent hover:bg-surface-container-high/50 text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center transition-colors ${
                        isSelected ? 'text-primary' : 'text-on-surface-variant'
                      }`}>
                        <Database size={20} />
                      </div>
                      <div>
                        <span className={`font-bold text-sm block transition-colors ${
                          isSelected ? 'text-white' : 'group-hover:text-white'
                        }`}>{p.name}</span>
                        <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none mt-1 block">
                          {providerModels.length} Models Active
                        </span>
                      </div>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${stats.bg} ${stats.status === 'Healthy' ? 'animate-pulse shadow-[0_0_10px_rgba(78,222,163,0.5)]' : ''}`} />
                  </div>
                  <div className="flex justify-start">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${stats.color}`}>
                      {stats.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 border-2 border-dashed border-outline-variant/10 rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
                <Server size={24} className="mb-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No providers registered yet.<br/>Establish logical gateways in the infrastructure hub.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed View */}
        <div className="lg:col-span-8 space-y-8">
          {provider ? (
            <div className="bg-surface-container-low rounded-3xl overflow-hidden ring-1 ring-outline-variant/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <div className="p-10 relative overflow-hidden">
                {/* Background mesh/gradient */}
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-inner group transition-all duration-500 hover:ring-primary/40">
                      <Monitor size={40} className="text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-headline font-black text-white tracking-tight">{provider.name}</h2>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[9px] font-black uppercase tracking-widest rounded ring-1 ring-secondary/20 font-headline">Primary</span>
                        </div>
                      </div>
                      <p className="text-on-surface-variant/60 text-sm mt-2">{provider.description || 'Infrastructure gateway for agentic cognition & reasoning.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="p-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/10">
                      <RotateCw size={18} />
                    </button>
                    <button className="p-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/10">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Provider Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12 relative z-10">
                  {[
                    { label: 'Latency', value: '182ms', color: 'text-tertiary', bar: 'bg-tertiary', width: '75%' },
                    { label: 'Success Rate', value: '99.9%', color: 'text-secondary', bar: 'bg-secondary', width: '99%' },
                    { label: 'Uptime', value: '30d 12h', color: 'text-primary', bar: 'bg-primary', width: '100%' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] font-black mb-2">{stat.label}</p>
                      <p className={`text-2xl font-headline font-black ${stat.color}`}>{stat.value}</p>
                      <div className="w-full bg-surface-container-highest/30 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`${stat.bar} h-full rounded-full transition-all duration-1000 delay-300`} style={{ width: stat.width }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Management */}
              <div className="p-10 border-t border-outline-variant/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/40">Endpoint URL</label>
                    <div className="relative group">
                      <input 
                        readOnly 
                        defaultValue={provider.name.includes('Gemini') ? 'https://generativelanguage.googleapis.com/v1beta' : 'https://api.openai.com/v1'}
                        className="w-full bg-surface-container-highest/20 border-none rounded-xl text-xs font-mono py-4 px-5 text-primary focus:ring-1 focus:ring-primary h-12" 
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/40">Management API Key</label>
                    <div className="relative group">
                      <input 
                        type="password" 
                        defaultValue="********************************"
                        className="w-full bg-surface-container-highest/20 border-none rounded-xl text-xs font-mono py-4 px-14 text-white focus:ring-1 focus:ring-primary h-12 border-none ring-0 outline-none" 
                      />
                      <button className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors">
                        <Eye size={16} />
                      </button>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                         <button className="text-on-surface-variant/40 hover:text-primary transition-colors">
                           <RotateCw size={16} />
                         </button>
                         <button className="text-on-surface-variant/40 hover:text-primary transition-colors">
                           <Copy size={16} />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Models Table */}
              <div className="p-10 border-t border-outline-variant/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h3 className="font-headline font-black text-lg text-white">Registered Models</h3>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] font-bold text-on-surface-variant">{providerModels.length} Models</span>
                  </div>
                  <button 
                    onClick={() => setIsModelModalOpen(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus size={12} />
                    </div>
                    Register New Model
                  </button>
                </div>

                <div className="rounded-2xl border border-outline-variant/5 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high/30 text-on-surface-variant/40 font-black uppercase tracking-[0.2em]">
                        <th className="py-5 px-6">Model ID</th>
                        <th className="py-5 px-6">Capabilities</th>
                        <th className="py-5 px-6 text-right">Status</th>
                        <th className="py-5 px-6 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {isLoadingModels ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                              <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse">Hydrating Model Registry...</p>
                            </div>
                          </td>
                        </tr>
                      ) : providerModels.length > 0 ? providerModels.map((m, i) => (
                        <tr key={i} className="group hover:bg-primary/5 transition-all">
                          <td className="py-5 px-6 font-mono text-on-surface font-medium">{m.name}</td>
                          <td className="py-5 px-6">
                            <div className="flex gap-2">
                              {['TEXT', 'VISION'].map(cap => (
                                <span key={cap} className="px-2 py-0.5 bg-tertiary/10 text-tertiary rounded-[4px] text-[8px] font-black tracking-tight">{cap}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded font-black text-[8px] uppercase tracking-widest bg-secondary/10 text-secondary">Active</span>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <button className="text-on-surface-variant/40 hover:text-white transition-colors">
                              <MoreVertical size={14} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                         <tr>
                           <td colSpan={4} className="py-12 text-center text-on-surface-variant/20 italic font-medium">No models registered for this provider gate.</td>
                         </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/10 flex flex-col items-center justify-center text-on-surface-variant gap-4 opacity-40">
               <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center shadow-inner">
                 <Monitor size={40} className="text-primary/50" />
               </div>
               <div className="text-center">
                 <h3 className="text-sm font-headline font-black text-white uppercase tracking-widest mb-1">Infrastructure Hub</h3>
                 <p className="text-[10px] font-medium opacity-60">Select a provider on the left to view active node details.</p>
               </div>
            </div>
          )}

          {/* Usage Logs / Terminal View */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-on-surface-variant/5 italic text-[10px] font-mono select-none">SYSTEM_STREAM_L09</div>
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/5 pb-5">
              <span className="flex items-center gap-3 uppercase tracking-[0.2em] font-black text-[10px] text-tertiary">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_rgba(78,222,163,0.5)]"></span>
                Live System Event Stream
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-[9px] font-bold text-on-surface-variant/60">
                <Terminal size={12} />
                <span>FILTER: gemini-1.5-*</span>
              </div>
            </div>
            <div className="space-y-2 font-mono text-[11px] leading-relaxed">
              <p className="flex gap-4"><span className="text-on-surface-variant/30">[14:22:01]</span> <span className="text-primary font-bold">INFO</span> <span className="text-on-surface-variant/80 font-medium">Node connected: gemini-1.5-pro-instance-09</span></p>
              <p className="flex gap-4"><span className="text-on-surface-variant/30">[14:22:05]</span> <span className="text-secondary font-bold">TRANS</span> <span className="text-on-surface-variant/80 font-medium">Request successful: UUID-4421-AX (Lat: 154ms)</span></p>
              <p className="flex gap-4"><span className="text-on-surface-variant/30">[14:23:12]</span> <span className="text-secondary font-bold">TRANS</span> <span className="text-on-surface-variant/80 font-medium">Request successful: UUID-9901-BL (Lat: 162ms)</span></p>
              <p className="flex gap-4"><span className="text-on-surface-variant/30">[14:24:45]</span> <span className="text-tertiary font-bold">WARN</span> <span className="text-on-surface-variant/80 font-medium">Rate limit approach: gemini-1.5-flash (88% quota)</span></p>
              <p className="flex gap-4"><span className="text-on-surface-variant/30">[14:25:00]</span> <span className="text-primary font-bold">INFO</span> <span className="text-on-surface-variant/80 font-medium">Health check passed for all 2 providers.</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating System Status */}
      <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
        <div className="bg-[#131b2e]/60 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-3 ring-1 ring-white/10 shadow-2xl shadow-black/50 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-primary/5 to-tertiary/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex -space-x-1.5 relative z-10">
            <div className="w-4 h-4 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]" />
            <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.5)]" />
            <div className="w-4 h-4 rounded-full bg-tertiary shadow-[0_0_8px_rgba(221,183,255,0.5)]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 relative z-10">System Synchronized</span>
        </div>
      </div>

      <RegisterProviderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={() => {
          fetchProviders();
          setIsModalOpen(false);
        }}
      />
      
      <CreateModelModal 
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onCreated={() => {
          if (selectedProvider) fetchModelsForProvider(selectedProvider);
          setIsModelModalOpen(false);
        }}
        providerId={selectedProvider || ''}
        providerName={provider?.name || ''}
      />
    </div>
  );
};

export default Providers;
