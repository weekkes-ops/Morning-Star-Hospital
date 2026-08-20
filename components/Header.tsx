
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ViewType, User, Patient, PatientStatus } from '../types';

interface HeaderProps {
  activeView: ViewType;
  onMenuClick: () => void;
  currentUser: User;
  patients: Patient[];
}

const Header: React.FC<HeaderProps> = ({ activeView, onMenuClick, currentUser, patients }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    switch (activeView) {
      case 'DASHBOARD': return 'Hospital Operations';
      case 'REGISTRATION': return 'Patient Registration';
      case 'DOCTOR': return 'Medical Consultation';
      case 'LAB': return 'Lab Diagnostics';
      case 'PHARMACY': return 'Pharmacy & Billing';
      case 'STORE': return 'Medical Inventory';
      case 'CLINIC': return 'Clinic Management';
      case 'HR': return 'Personnel & Admin';
      case 'XRAY': return 'Imaging Services';
      case 'FINANCE': return 'Financial Accounts';
      default: return 'MSH Main HMS';
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Lab Result Ready', time: '5m ago', desc: 'Patient P-8821 results uploaded.', icon: 'fa-flask', color: 'text-blue-500' },
    { id: 2, title: 'Pharmacy Alert', time: '12m ago', desc: 'Amoxicillin stock is below 10%.', icon: 'fa-pills', color: 'text-amber-500' },
    { id: 3, title: 'Emergency Sync', time: '1h ago', desc: 'Cloud database backup completed.', icon: 'fa-cloud-arrow-up', color: 'text-emerald-500' },
  ];

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const getPatientHistory = (mobile: string) => {
    return patients
      .filter(p => p.mobile === mobile)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase();
    
    const matched = patients.filter(p => {
      return (
        p.name.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.mobile && p.mobile.includes(term))
      );
    });

    const uniqueMap = new Map<string, Patient>();
    matched.forEach(p => {
      const existing = uniqueMap.get(p.mobile);
      if (!existing || new Date(p.date) > new Date(existing.date)) {
        uniqueMap.set(p.mobile, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [patients, searchQuery]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="glass h-20 border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-30 relative">
        <div className="flex items-center space-x-4 shrink-0">
          <button 
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{getTitle()}</h2>
            <div className="flex items-center space-x-2 mt-1.5">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Morning Star Hospital • 24 Hours Service</span>
               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
               <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Active Session: {currentUser.name.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchContainerRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-800"
              placeholder="Search patients by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}

            {/* Search Dropdown Results */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute left-0 mt-3 w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100/80 overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Found {filteredPatients.length} patient{filteredPatients.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md uppercase">Master Patient Index</span>
                </div>
                {filteredPatients.length > 0 ? (
                  <div className="divide-y divide-slate-100/60">
                    {filteredPatients.map(p => {
                      const statusColors = p.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : p.status === 'Registered' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100';

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-xs text-blue-600 overflow-hidden border border-blue-100 group-hover:scale-105 transition-transform">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">
                                Age {calculateAge(p.dob)} • {p.mobile}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-700 font-mono tracking-tighter bg-slate-100 px-2 py-0.5 rounded-lg">{p.id}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md mt-1.5 ${statusColors}`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <i className="fa-solid fa-user-slash text-2xl mb-2 text-slate-300"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching patients</p>
                    <p className="text-[9px] font-medium text-slate-400 mt-1">Check spelling or double check Patient ID</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-5 shrink-0">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`md:hidden w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${isMobileSearchOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
            title="Search Patients"
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </button>

          <div className="hidden sm:flex items-center px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-500 space-x-2">
            <i className="fa-regular fa-clock text-blue-600"></i>
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          
          <div className="flex items-center space-x-2 relative">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center relative ${showNotifications ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
                title="Notifications"
              >
                <i className="fa-solid fa-bell text-sm"></i>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">3</span>
              </button>
  
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <h4 className="font-black text-xs uppercase tracking-widest">Alert Center</h4>
                    <button className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-tighter">Clear All</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.map(n => (
                      <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex space-x-4">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ${n.color} group-hover:scale-110 transition-transform`}>
                            <i className={`fa-solid ${n.icon}`}></i>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-start">
                              <h5 className="text-[11px] font-black text-slate-900">{n.title}</h5>
                              <span className="text-[9px] text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">{n.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full p-4 bg-slate-50 text-[10px] font-black text-blue-600 uppercase tracking-widest border-t border-slate-100 hover:bg-blue-50 transition-colors">
                    View All Activity
                  </button>
                </div>
              )}
            </div>
  
            <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
  
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
                className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-all ${showSettings ? 'bg-blue-600 text-white ring-4 ring-blue-500/10' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                title="System Settings"
              >
                <i className="fa-solid fa-gear text-sm"></i>
              </button>
  
              {showSettings && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-50">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Terminal Config</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Dark Mode</span>
                        <div className="w-10 h-5 bg-slate-200 rounded-full relative">
                          <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Auto-Print Reports</span>
                        <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                          <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Audit Logging</span>
                        <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                          <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50">
                    <div className="flex items-center space-x-3 p-2 bg-white rounded-xl border border-slate-100 mb-2">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">{currentUser.role.charAt(0)}</div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{currentUser.role}</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay/Drawer */}
      {isMobileSearchOpen && (
        <div className="absolute top-20 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-40 p-4 md:hidden animate-in slide-in-from-top duration-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
              placeholder="Search patients by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {searchQuery.trim() && (
            <div className="mt-3 bg-white rounded-2xl border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredPatients.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setIsMobileSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-black text-[10px] text-blue-600 border border-blue-100">
                          {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-tight">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400">
                            Age {calculateAge(p.dob)} • {p.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.id}</span>
                        <span className="text-[8px] font-bold text-blue-600 mt-1 uppercase">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  <p className="text-[10px] font-black uppercase tracking-widest">No patients found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patient EHR 360 Viewer Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-slate-900/10 pointer-events-none" />
              <div className="flex items-center space-x-4 md:space-x-6 relative z-10">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center text-xl md:text-2xl font-black text-blue-300 overflow-hidden shrink-0">
                  {selectedPatient.photoUrl ? (
                    <img src={selectedPatient.photoUrl} alt={selectedPatient.name} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                  ) : (
                    selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg md:text-2xl font-black tracking-tight leading-none">{selectedPatient.name}</h3>
                    <span className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-300">
                      {selectedPatient.isInPatient ? 'In-Patient' : 'Out-Patient'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-slate-300 text-xs font-semibold">
                    <span>ID: <strong className="text-white font-mono">{selectedPatient.id}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>DOB: <strong className="text-white">{selectedPatient.dob}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Age: <strong className="text-white">{calculateAge(selectedPatient.dob)} Yrs</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Mobile: <strong className="text-white">{selectedPatient.mobile}</strong></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10 shrink-0 border border-white/5"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
              {/* Patient Location (for In-Patients) */}
              {selectedPatient.isInPatient && (
                <div className="grid grid-cols-3 gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ward No</p>
                    <p className="text-sm font-bold text-blue-700 mt-1">{selectedPatient.wardNumber || 'N/A'}</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Floor</p>
                    <p className="text-sm font-bold text-blue-700 mt-1">{selectedPatient.floor || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bed No</p>
                    <p className="text-sm font-bold text-blue-700 mt-1">{selectedPatient.bedNumber || 'N/A'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Clinical visit logs & details */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                      <i className="fa-solid fa-clock-rotate-left mr-2 text-blue-600"></i>
                      Clinical Visit History
                    </h4>
                    
                    {(() => {
                      const history = getPatientHistory(selectedPatient.mobile);
                      if (history.length === 0) {
                        return (
                          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                            <p className="text-xs font-bold">No previous visits recorded.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-6">
                          {history.map((h, idx) => (
                            <div key={h.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all relative">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{h.date}</span>
                                    {idx === 0 && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[8px] font-black uppercase tracking-wider">Latest Visit</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Ref ID: {h.id}</p>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-500">{h.clinic}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    h.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                    h.status === 'Registered' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                  }`}>
                                    {h.status}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                {/* Chief Complaint */}
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Chief Complaint / Condition</p>
                                  <p className="text-xs text-slate-700 font-medium italic">"{h.condition || 'No description recorded.'}"</p>
                                </div>

                                {/* Doctor's Consultation Notes */}
                                {h.doctorNotes && (
                                  <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Physician Key Findings</p>
                                    <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">{h.doctorNotes}</p>
                                  </div>
                                )}

                                {/* Investigations & Interventions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Lab Section */}
                                  {((h.selectedTests && h.selectedTests.length > 0) || (h.labResults && h.labResults.length > 0)) && (
                                    <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                      <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center">
                                        <i className="fa-solid fa-flask mr-1.5"></i> Laboratory Tests
                                      </p>
                                      {h.labResults && h.labResults.length > 0 ? (
                                        <div className="space-y-2">
                                          {h.labResults.map((lr, lIdx) => (
                                            <div key={lIdx} className="text-[10px] border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                              <p className="font-bold text-slate-700">{lr.testName}</p>
                                              <div className="space-y-1 mt-1">
                                                {lr.parameters.map((param, pIdx) => (
                                                  <div key={pIdx} className="flex justify-between text-[9px] text-slate-500">
                                                    <span>{param.name}: <strong>{param.value} {param.unit}</strong></span>
                                                    <span className={`font-bold ${param.status !== 'Normal' ? 'text-rose-500' : 'text-emerald-500'}`}>{param.status}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <ul className="list-disc list-inside text-[10px] text-slate-600 font-bold space-y-1">
                                          {h.selectedTests.map((t, tIdx) => (
                                            <li key={tIdx}>{t}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}

                                  {/* X-Ray Section */}
                                  {((h.selectedXRay && h.selectedXRay.length > 0) || (h.xRayResults && h.xRayResults.length > 0)) && (
                                    <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                      <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center">
                                        <i className="fa-solid fa-x-ray mr-1.5"></i> Imaging Diagnostics
                                      </p>
                                      {h.xRayResults && h.xRayResults.length > 0 ? (
                                        <div className="space-y-2">
                                          {h.xRayResults.map((xr, xIdx) => (
                                            <div key={xIdx} className="text-[10px] border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                              <p className="font-bold text-slate-700">{xr.viewName}</p>
                                              <p className="text-[9px] text-slate-500 italic mt-1">"Findings: {xr.findings}"</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <ul className="list-disc list-inside text-[10px] text-slate-600 font-bold space-y-1">
                                          {h.selectedXRay.map((x, xIdx) => (
                                            <li key={xIdx}>{x}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Prescribed Medicines */}
                                {((h.selectedMedicine && h.selectedMedicine.length > 0) || (h.pharmacySales && h.pharmacySales.length > 0)) && (
                                  <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center">
                                      <i className="fa-solid fa-pills mr-1.5"></i> Pharmacy Prescriptions
                                    </p>
                                    {h.pharmacySales && h.pharmacySales.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {h.pharmacySales.map((ps, psIdx) => (
                                          <span key={psIdx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 flex items-center">
                                            {ps.item} <strong className="text-slate-800 ml-1">x{ps.quantity}</strong>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {h.selectedMedicine.map((med, mIdx) => (
                                          <span key={mIdx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600">
                                            {med}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right side: Summary indicators & appointments */}
                <div className="space-y-6">
                  {/* General Stats Box */}
                  <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-[2rem] space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Chart metrics</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                        <i className="fa-solid fa-hospital-user text-blue-600 mb-1"></i>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Visits</p>
                        <p className="text-xl font-black text-slate-800 mt-1">{getPatientHistory(selectedPatient.mobile).length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                        <i className="fa-solid fa-hand-holding-dollar text-emerald-500 mb-1"></i>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Revenues</p>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          Le {getPatientHistory(selectedPatient.mobile).reduce((sum, h) => sum + (h.consultationFee || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Appointments / Follow-ups */}
                  <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <i className="fa-solid fa-calendar-check mr-1.5 text-blue-600"></i> Scheduled Follow-ups
                      </h5>
                      <span className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-600">
                        {getPatientHistory(selectedPatient.mobile).reduce((sum, h) => sum + (h.appointments ? h.appointments.length : 0), 0)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(() => {
                        const visits = getPatientHistory(selectedPatient.mobile);
                        const allAppointments = visits.flatMap(v => (v.appointments || []).map(app => ({ ...app, clinic: v.clinic })));
                        
                        if (allAppointments.length === 0) {
                          return (
                            <div className="p-6 text-center bg-white border border-slate-100 rounded-2xl text-slate-400">
                              <p className="text-[10px] font-bold">No future appointments booked.</p>
                            </div>
                          );
                        }

                        return allAppointments.map((app, appIdx) => (
                          <div key={appIdx} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-wider">{app.clinic}</span>
                                <p className="text-xs font-black text-slate-800 mt-2">{app.reason}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-800">{app.date}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{app.time}</p>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <p className="text-[10px] font-semibold text-slate-400">Morning Star Hospital Unified HMS • Confidential Patient File</p>
              <button 
                onClick={() => setSelectedPatient(null)} 
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
