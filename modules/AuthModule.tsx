
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';

interface AuthModuleProps {
  onLogin: (email: string, pass: string) => boolean | string;
  onSignup: (user: Partial<User>) => void;
}

const AuthModule: React.FC<AuthModuleProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DOCTOR);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = onLogin(email, password);
    if (typeof result === 'string') {
      setError(result);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    onSignup({ email, password, name, role });
    setSuccess('Account created successfully! You can now log in.');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100">
        {/* Left Branding Panel */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mb-32"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 rounded-full -ml-16 -mt-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-12">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <i className="fa-solid fa-star text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none">MSH <span className="text-blue-500">MAIN</span></h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Morning Star Hospital</p>
              </div>
            </div>
            
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <i className="fa-solid fa-heart-pulse"></i>
              <span>Your Health is our PRIORITY</span>
            </div>

            <h2 className="text-4xl font-black leading-tight mb-6">Secured Clinical Access Point.</h2>
            <p className="text-slate-400 font-medium leading-relaxed max-w-sm mb-4">
              Authorized personnel only. Please sign in to access Morning Star Hospital medical records, patient intake, and operational terminal.
            </p>
            <p className="text-slate-400 text-xs font-bold">
              <i className="fa-solid fa-phone mr-2 text-blue-400"></i>+232 73 929 145, +232 78 355 293
            </p>
          </div>

          <div className="relative z-10 pt-12 border-t border-slate-800">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="text-xs font-bold text-slate-300">24 Hours Service Everyday</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">v4.2.1 Stable</span>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">© 2024 Morning Star Hospital IT Division</p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900">{isLogin ? 'Sign In to Terminal' : 'Request Staff Account'}</h3>
            <p className="text-slate-400 text-sm font-medium mt-2">
              {isLogin ? 'Enter your credentials to continue.' : 'Register your details to create an account.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-600 text-xs font-bold">
              <i className="fa-solid fa-circle-check"></i>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Staff Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm transition-all"
                  placeholder="Dr. John Doe"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm transition-all"
                placeholder="name@morningstarhospital.sl"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requested Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm appearance-none cursor-pointer"
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] transition-all mt-8"
            >
              {isLogin ? 'Authorize Entry' : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
             <p className="text-sm font-medium text-slate-500">
               {isLogin ? "Need a staff account?" : "Already have an account?"} 
               <button 
                 onClick={() => setIsLogin(!isLogin)}
                 className="ml-2 text-blue-600 font-black hover:underline"
               >
                 {isLogin ? 'Register Here' : 'Log In Instead'}
               </button>
             </p>
          </div>
          
          {isLogin && (
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-bold leading-relaxed text-center italic">
              Tip: Use admin@morningstarhospital.sl (or admin@msh.sl) / admin123 for initial setup.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModule;
