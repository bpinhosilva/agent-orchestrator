import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContextInstance';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Security keys do not match. Please re-verify.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: any) {
      let message = err.response?.data?.message || 'Protocol registration failed. Please try again.';
      if (Array.isArray(message)) {
        message = message.join('. ');
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary selection:text-on-primary min-h-screen">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 bg-transparent z-50">
        <div className="text-xl font-bold tracking-tight text-[#adc6ff] font-headline">Aetheric Logic</div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined hover:text-[#adc6ff] transition-colors cursor-pointer">help_outline</span>
          <span className="material-symbols-outlined hover:text-[#adc6ff] transition-colors cursor-pointer">dark_mode</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="min-h-screen flex items-center justify-center bg-glow relative px-4 overflow-hidden py-20">
        {/* Abstract Background Detail */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary blur-[120px] rounded-full"></div>
        </div>

        {/* Central Register Card */}
        <section className="glass-panel ghost-border w-full max-w-md rounded-xl p-8 md:p-12 relative z-10 accent-glow">
          {/* Header/Logo Area */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-6 ghost-border">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </div>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface uppercase mb-2">Registration</h1>
            <p className="font-label text-xs tracking-widest text-on-surface-variant uppercase">New Agent Protocol</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <span className="material-symbols-outlined text-error text-xl">error</span>
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Agent Handle</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">fingerprint</span>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-4 pl-12 pr-4 text-sm font-body text-on-surface placeholder:text-surface-variant focus:ring-1 focus:ring-tertiary transition-all duration-300" 
                  placeholder="agent.zero" 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Identity Protocol</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">alternate_email</span>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-4 pl-12 pr-4 text-sm font-body text-on-surface placeholder:text-surface-variant focus:ring-1 focus:ring-tertiary transition-all duration-300" 
                  placeholder="email@aetheric.logic" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Security Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">vibration</span>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-4 pl-12 pr-4 text-sm font-body text-on-surface placeholder:text-surface-variant focus:ring-1 focus:ring-tertiary transition-all duration-300" 
                  placeholder="••••••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Re-verify Security Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock_reset</span>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-4 pl-12 pr-4 text-sm font-body text-on-surface placeholder:text-surface-variant focus:ring-1 focus:ring-tertiary transition-all duration-300" 
                  placeholder="••••••••••••" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-4 space-y-4">
              <button 
                className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline font-bold py-4 rounded-lg shadow-lg shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                ) : (
                  <>
                    Initialize Protocol
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">bolt</span>
                  </>
                )}
              </button>

              <div className="pt-4 text-center">
                <p className="font-label text-xs text-outline">
                  Already have a protocol?{' '}
                  <Link to="/login" className="text-primary hover:text-tertiary transition-colors font-bold uppercase tracking-widest">Login</Link>
                </p>
              </div>
            </div>
          </form>
        </section>
      </main>

      {/* Footer Navigation Anchor */}
      <footer className="fixed bottom-0 w-full flex flex-col md:flex-row justify-center items-center gap-4 pb-8 bg-transparent z-50">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">© 2024 Aetheric Logic Orchestrator. All rights reserved.</p>
        <div className="flex gap-6">
          <a className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-[#adc6ff] transition-opacity duration-200" href="#">Security Architecture</a>
          <a className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-[#adc6ff] transition-opacity duration-200" href="#">Privacy Policy</a>
          <a className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-[#adc6ff] transition-opacity duration-200" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default Register;
