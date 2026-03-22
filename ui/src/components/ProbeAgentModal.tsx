import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Terminal, Brain, Loader2, AlertCircle, CheckCircle2, Activity, ImageIcon } from 'lucide-react';
import { agentsApi, type Agent } from '../api/agents';

interface ProbeAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

const ProbeAgentModal: React.FC<ProbeAgentModalProps> = ({ isOpen, onClose, agent }) => {
  const DEFAULT_INPUT = 'Wake up, who are you?';
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [response, setResponse] = useState('');
  const [imageResponse, setImageResponse] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      setResponse('');
      setImageResponse(undefined);
      setStatus('idle');
      setInput(DEFAULT_INPUT);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleProbe = async () => {
    if (!agent?.id || !input.trim()) return;

    try {
      setLoading(true);
      setStatus('idle');
      setResponse('Awaiting response from neural node...');
      setImageResponse(undefined);
      
      const { data } = await agentsApi.probe(agent.id, input);
      setResponse(data.content);
      setImageResponse(data.image);
      setStatus('success');
    } catch (error: unknown) {
      console.error('Probe failed:', error);
      let errorMessage = 'An unexpected error occurred during the probe.';
      if (error && typeof error === 'object' && 'response' in error) {
        const anyError = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        errorMessage =
          anyError.response?.data?.message || anyError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setResponse(`ERROR: ${errorMessage}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Brain size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black font-headline text-white tracking-tight">Probe: {agent?.name}</h2>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Neural Direct Message</p>
              </div>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors p-2">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {/* Input Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
                <Terminal size={12} />
                Command Input
              </label>
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your command..."
                  className="w-full bg-surface-container-highest/30 rounded-xl p-4 text-sm text-on-surface h-32 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none border border-outline-variant/10 group-hover:border-outline-variant/30"
                />
                <button
                  onClick={handleProbe}
                  disabled={loading || !input.trim()}
                  className="absolute bottom-3 right-3 p-2.5 rounded-lg bg-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
                  <Activity size={12} className={loading ? 'animate-pulse' : ''} />
                  Neural Response
                </label>
                {status === 'success' && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                    <CheckCircle2 size={10} /> Sync Complete
                  </span>
                )}
                {status === 'error' && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-error uppercase bg-error/10 px-2 py-0.5 rounded">
                    <AlertCircle size={10} /> Link Severed
                  </span>
                )}
              </div>
              
              {/* Text Response */}
              <div className={`w-full min-h-[100px] bg-black/40 rounded-xl p-5 border border-outline-variant/5 font-mono text-sm leading-relaxed transition-all duration-500 whitespace-pre-wrap ${
                status === 'error' ? 'text-error/80 border-error/20' : 
                status === 'success' ? 'text-secondary/90 border-secondary/20 shadow-[inset_0_0_20px_rgba(102,231,175,0.05)]' :
                'text-on-surface-variant/60'
              }`}>
                {response || 'Enter a command and initiate the probe to see the agent response.'}
              </div>

              {/* Image Response */}
              <AnimatePresence>
                {imageResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
                      <ImageIcon size={12} />
                      Visual Output
                    </label>
                    <div className="relative rounded-xl overflow-hidden border border-outline-variant/10 bg-surface-container-highest/20 group">
                      <img 
                        src={`data:image/png;base64,${imageResponse}`} 
                        alt="Neural Output" 
                        className="w-full h-auto max-h-[400px] object-contain mx-auto"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Generated Content</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="px-6 py-4 bg-surface-container-high/50 border-t border-outline-variant/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-all"
            >
              Close Terminal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProbeAgentModal;
