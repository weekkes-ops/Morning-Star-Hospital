
import React, { useState } from 'react';
import { Patient, User, UserRole } from '../types';

interface ClinicModuleProps {
  patients: Patient[];
  clinicFees: Record<string, number>;
  onUpdateFees: (fees: Record<string, number>) => void;
  currentUser: User;
}

const ClinicModule: React.FC<ClinicModuleProps> = ({ patients, clinicFees, onUpdateFees, currentUser }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editableFees, setEditableFees] = useState<Record<string, number>>(clinicFees);
  const [selectedClinics, setSelectedClinics] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState<string>('');

  const clinics = [
    { name: 'Urology & Andrology', icon: 'fa-kidney', color: 'bg-blue-500' },
    { name: 'General Surgery', icon: 'fa-scalpel', color: 'bg-indigo-500' },
    { name: 'Orthopedics', icon: 'fa-bone', color: 'bg-slate-700' },
    { name: 'Gynecology', icon: 'fa-venus', color: 'bg-pink-500' },
    { name: 'Obstetrics & Infertility', icon: 'fa-baby', color: 'bg-rose-400' },
    { name: 'GIT, Liver & Endoscopy', icon: 'fa-stomach', color: 'bg-emerald-600' },
    { name: 'Cardiology', icon: 'fa-heart-pulse', color: 'bg-red-500' },
    { name: 'Internal Medicine', icon: 'fa-lungs', color: 'bg-teal-600' },
    { name: 'Pediatrics', icon: 'fa-children', color: 'bg-amber-400' },
    { name: 'Family Medicine', icon: 'fa-house-user', color: 'bg-cyan-600' }
  ];

  const handleSaveFees = () => {
    onUpdateFees(editableFees);
    setIsAdminMode(false);
    setSelectedClinics(new Set());
    alert('Global consultation pricing policy updated successfully.');
  };

  const handleFeeChange = (name: string, val: string) => {
    const num = parseInt(val) || 0;
    setEditableFees(prev => ({ ...prev, [name]: num }));
  };

  const toggleSelect = (name: string) => {
    const next = new Set(selectedClinics);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedClinics(next);
  };

  const toggleSelectAll = () => {
    if (selectedClinics.size === clinics.length) {
      setSelectedClinics(new Set());
    } else {
      setSelectedClinics(new Set(clinics.map(c => c.name)));
    }
  };

  const applyBulkFixed = () => {
    const val = parseInt(bulkValue);
    if (isNaN(val)) return;
    
    setEditableFees(prev => {
      const next = { ...prev };
      selectedClinics.forEach((name: string) => {
        next[name] = val;
      });
      return next;
    });
  };

  const applyBulkPercentage = (percent: number) => {
    setEditableFees(prev => {
      const next = { ...prev };
      const targets: string[] = selectedClinics.size > 0 
        ? Array.from(selectedClinics) 
        : clinics.map(c => c.name);
      
      targets.forEach((name: string) => {
        const current = next[name] || 0;
        const adjustment = Math.round(current * (percent / 100));
        next[name] = Math.max(0, current + adjustment);
      });
      return next;
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Specialty Clinic Hub</h2>
          <p className="text-slate-500 text-sm font-medium">Monitoring clinic capacity and service configuration.</p>
        </div>
        {currentUser.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center ${
              isAdminMode ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            <i className={`fa-solid ${isAdminMode ? 'fa-times' : 'fa-gear'} mr-3`}></i>
            {isAdminMode ? 'Exit Configuration' : 'Manage Consultation Fees'}
          </button>
        )}
      </div>

      {isAdminMode ? (
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight">Bulk PRICING Terminal</h3>
              <p className="text-slate-400 text-xs mt-1">Apply rapid adjustments to multiple clinical departments.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <button 
                onClick={toggleSelectAll}
                className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                {selectedClinics.size === clinics.length ? 'Deselect All' : 'Select All Departments'}
              </button>

              <div className="h-8 w-px bg-slate-800 hidden lg:block"></div>

              <div className="flex items-center space-x-2">
                <input 
                  type="number"
                  placeholder="Set Fee..."
                  value={bulkValue}
                  onChange={e => setBulkValue(e.target.value)}
                  className="w-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={applyBulkFixed}
                  disabled={!bulkValue || selectedClinics.size === 0}
                  className="px-4 py-3 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                >
                  Apply to {selectedClinics.size || '0'}
                </button>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden lg:block"></div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => applyBulkPercentage(5)}
                  className="px-3 py-3 bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  title="5% Increase"
                >
                  +5%
                </button>
                <button 
                  onClick={() => applyBulkPercentage(-5)}
                  className="px-3 py-3 bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                  title="5% Decrease"
                >
                  -5%
                </button>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 italic">
                  (Adjusts {selectedClinics.size || 'All'})
                </span>
              </div>
            </div>

            <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><i className="fa-solid fa-bolt text-9xl"></i></div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {clinics.map(c => {
                  const isSelected = selectedClinics.has(c.name);
                  return (
                    <div 
                      key={c.name} 
                      onClick={() => toggleSelect(c.name)}
                      className={`p-6 border-2 rounded-3xl cursor-pointer transition-all duration-300 group ${
                        isSelected ? 'bg-blue-50/50 border-blue-500 shadow-lg' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`${c.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm`}>
                            <i className={`fa-solid ${c.icon}`}></i>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{c.name}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <i className="fa-solid fa-check text-[10px]"></i>}
                        </div>
                      </div>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">SLE</span>
                        <input 
                          type="number" 
                          value={editableFees[c.name] || 0}
                          onChange={e => handleFeeChange(c.name, e.target.value)}
                          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xl outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center space-x-3 text-emerald-600">
                  <i className="fa-solid fa-circle-check text-xl"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Global Pricing Invariant Active.</p>
                </div>
                <div className="flex space-x-6 w-full sm:w-auto">
                   <button onClick={() => setIsAdminMode(false)} className="flex-1 sm:flex-none px-10 py-5 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:text-slate-600 transition-all">Discard</button>
                   <button onClick={handleSaveFees} className="flex-1 sm:flex-none px-14 py-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">Apply Policy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clinics.map(clinic => {
            const clinicPatients = patients.filter(p => p.clinic === clinic.name);
            const activeCount = clinicPatients.filter(p => p.status !== 'Completed').length;
            const currentFee = clinicFees[clinic.name] || 0;

            return (
              <div key={clinic.name} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 hover:shadow-xl transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-32 h-32 ${clinic.color} opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className={`${clinic.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}>
                    <i className={`fa-solid ${clinic.icon} text-2xl`}></i>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-slate-800">{activeCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Cases</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{clinic.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                  <span>Total Lifetime: {clinicPatients.length}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-blue-600 font-black uppercase tracking-tighter">Fee: SLE {currentFee.toLocaleString()}</span>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/150?u=${clinic.name}${i}`} className="w-6 h-6 rounded-full border-2 border-white" alt="Doctor" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+2</div>
                  </div>
                  <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                    Manage Queue <i className="fa-solid fa-arrow-right-long ml-1"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClinicModule;
