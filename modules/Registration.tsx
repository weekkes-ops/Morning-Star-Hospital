
import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus } from '../types.ts';

interface RegistrationProps {
  patients: Patient[];
  clinicFees: Record<string, number>;
  onRegister: (patient: Patient) => void;
  onUpdate: (patient: Patient) => void;
}

type SortKey = 'name' | 'id' | 'date';
type SortDirection = 'asc' | 'desc';

const Registration: React.FC<RegistrationProps> = ({ patients, clinicFees, onRegister, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [lastRegistered, setLastRegistered] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dobError, setDobError] = useState('');
  
  // Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'date', 
    direction: 'desc' 
  });
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const clinics = Object.keys(clinicFees);

  const [formData, setFormData] = useState({
    name: '', dob: '', mobile: '', isInPatient: false, bedNumber: '', floor: '', wardNumber: '',
    clinic: clinics.length > 0 ? clinics[0] : '', consultationFee: clinics.length > 0 ? (clinicFees[clinics[0]] || 0) : 0,
    hasFollowUp: false, followUpDate: '', followUpTime: '', followUpReason: '',
    photoUrl: ''
  });

  const handleMobileChange = (mobile: string) => {
    setFormData(prev => ({ ...prev, mobile }));
    
    // Auto-lookup existing patient to pre-fill known data
    if (mobile.length >= 8) {
      const existing = patients.find(p => p.mobile === mobile);
      if (existing) {
        setFormData(prev => ({
          ...prev,
          name: existing.name,
          dob: existing.dob,
          photoUrl: existing.photoUrl || ''
        }));
      }
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = patients.filter(p => p.date === today).length;
    return { todayCount, inPatients: patients.filter(p => p.isInPatient).length };
  }, [patients]);

  const handleClinicChange = (clinic: string) => {
    const fee = clinicFees[clinic] || 0;
    setFormData(prev => ({ ...prev, clinic, consultationFee: fee }));
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate DOB
    const age = calculateAge(formData.dob);
    if (age === 'N/A' || typeof age !== 'number' || age < 0 || age > 120) {
      setDobError('Please enter a valid date of birth (age must be between 0 and 120).');
      return;
    }
    setDobError('');

    const newPatient: Patient = {
      ...formData,
      id: `P-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      status: PatientStatus.REGISTERED,
      selectedTests: [], selectedMedicine: [], selectedXRay: [], appointments: []
    };
    onRegister(newPatient);
    setLastRegistered(newPatient);
    setFormData({
      name: '', dob: '', mobile: '', isInPatient: false, bedNumber: '', floor: '', wardNumber: '',
      clinic: clinics[0], condition: '', consultationFee: clinicFees[clinics[0]] || 0,
      hasFollowUp: false, followUpDate: '', followUpTime: '', followUpReason: '',
      photoUrl: ''
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage performance
        alert("Photo is too large. Please select an image smaller than 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const termParts = term.split(/\s+/).filter(Boolean);
    
    // 1. Initial Filtering (Search + Date Range)
    let result = patients.filter(p => {
      const nameMatch = termParts.every(part => p.name.toLowerCase().includes(part));
      const idMatch = p.id.toLowerCase().includes(term);
      const mobileMatch = p.mobile.includes(term);
      const searchMatch = !searchTerm.trim() || nameMatch || idMatch || mobileMatch;

      const dateStartMatch = !dateFilter.start || p.date >= dateFilter.start;
      const dateEndMatch = !dateFilter.end || p.date <= dateFilter.end;

      return searchMatch && dateStartMatch && dateEndMatch;
    });

    // 2. Grouping by unique identity (using mobile) for list view
    const uniquePatientsMap = new Map<string, Patient>();
    result.forEach(p => {
      const existing = uniquePatientsMap.get(p.mobile);
      if (!existing || new Date(p.date) > new Date(existing.date)) {
        uniquePatientsMap.set(p.mobile, p);
      }
    });
    
    let processed = Array.from(uniquePatientsMap.values());

    // 3. Sorting
    processed.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  }, [patients, searchTerm, dateFilter, sortConfig]);

  const getPatientHistory = (mobile: string) => {
    return patients
      .filter(p => p.mobile === mobile)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

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

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {lastRegistered && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 no-print" onClick={() => setLastRegistered(null)}></div>
          <div className="bg-white w-full max-w-xl p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
            <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase">Admission Slip</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Morning Star Hospital</p>
                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mt-0.5">Your Health is our PRIORITY</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Tel: +232 73 929 145, +232 78 355 293 • 24 Hours Service</p>
              </div>
              <div className="text-right"><p className="text-sm font-mono font-black">{lastRegistered.id}</p></div>
            </div>
            <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Patient Name</p><p className="font-bold">{lastRegistered.name}</p></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Clinic</p><p className="font-bold">{lastRegistered.clinic}</p></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Status</p><p className="font-bold">{lastRegistered.isInPatient ? 'In-Patient' : 'Out-Patient'}</p></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Date</p><p className="font-bold">{lastRegistered.date}</p></div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fee Paid</p>
                <p className="text-xl font-black text-blue-600">SLE {lastRegistered.consultationFee.toLocaleString()}</p>
              </div>
            </div>
            <div className="no-print flex space-x-4">
              <button onClick={() => setLastRegistered(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest">Close</button>
              <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Print Slip</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fa-solid fa-user-clock text-xl"></i></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrations Today</p><h4 className="text-xl font-black text-slate-900">{stats.todayCount} New Admissions</h4></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="fa-solid fa-bed-pulse text-xl"></i></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active In-Patients</p><h4 className="text-xl font-black text-slate-900">{stats.inPatients} Occupied Beds</h4></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/50 overflow-hidden sticky top-8">
            <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform"><i className="fa-solid fa-id-card text-9xl"></i></div>
              <div className="flex items-center space-x-6 relative z-10">
                <div className="relative group/photo">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover/photo:border-blue-500">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Patient" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-camera text-2xl text-white/30"></i>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload Patient Photo"
                  />
                  {formData.photoUrl && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, photoUrl: '' })); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/photo:opacity-100 transition-opacity"
                    >
                      <i className="fa-solid fa-times text-[10px]"></i>
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Patient Intake Terminal</h3>
                  <p className="text-slate-400 text-sm mt-1">New admission registration and billing center.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Enter name" />
                </div>
                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Mobile</label>
                    <input required type="tel" value={formData.mobile} onChange={e => handleMobileChange(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Contact number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input 
                      required 
                      type="date" 
                      value={formData.dob} 
                      onChange={e => {
                        setFormData({...formData, dob: e.target.value});
                        if (dobError) setDobError('');
                      }} 
                      className={`w-full px-6 py-4 bg-slate-50 border ${dobError ? 'border-rose-500' : 'border-slate-200'} rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all`} 
                    />
                    {dobError && <p className="text-[9px] font-bold text-rose-500 ml-1 animate-in fade-in slide-in-from-top-1">{dobError}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Department</label>
                  <select value={formData.clinic} onChange={e => handleClinicChange(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm cursor-pointer outline-none">
                    {clinics.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chief Complaint / Condition</label>
                <textarea required value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm h-24 resize-none outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Describe the patient's primary symptoms..." />
              </div>
              <div className="p-8 bg-slate-900 text-white rounded-[2rem] flex flex-col justify-between items-center gap-6 shadow-2xl">
                <div className="w-full text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Payable Consultation Fee</p>
                  <h4 className="text-3xl font-black">SLE {formData.consultationFee.toLocaleString()}</h4>
                </div>
                <button type="submit" className="w-full px-12 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-blue-700 transition-all hover:scale-[1.05] active:scale-95">Register & Generate Slip</button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
             <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Master Patient Index</h3>
                  <p className="text-slate-400 text-xs font-medium">Global database with advanced sorting and date filters.</p>
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center ${showFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <i className="fa-solid fa-sliders mr-2"></i> Quick Filters
                </button>
             </div>
             
             <div className="space-y-6 mb-8">
               <div className="relative group">
                 <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
                 <input 
                  type="text" 
                  placeholder="Query by name, mobile, or ID..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all" 
                 />
                 {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"><i className="fa-solid fa-circle-xmark"></i></button>}
               </div>

               {showFilters && (
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Since</label>
                      <input 
                        type="date" 
                        value={dateFilter.start}
                        onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Until</label>
                      <input 
                        type="date" 
                        value={dateFilter.end}
                        onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5"
                      />
                    </div>
                    <div className="col-span-full flex justify-end">
                      <button 
                        onClick={() => setDateFilter({ start: '', end: '' })}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Reset Date Filters
                      </button>
                    </div>
                 </div>
               )}
             </div>

             <div className="flex-1 overflow-hidden flex flex-col">
               {filteredPatients.length > 0 ? (
                 <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 rounded-3xl">
                    <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 bg-white z-10 shadow-sm">
                          <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             <th className="px-6 py-5 border-b border-slate-100 cursor-pointer group" onClick={() => handleSort('name')}>
                                <div className="flex items-center space-x-2">
                                  <span>Patient Identity</span>
                                  <i className={`fa-solid fa-sort ${sortConfig.key === 'name' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                                </div>
                             </th>
                             <th className="px-6 py-5 border-b border-slate-100 cursor-pointer group" onClick={() => handleSort('id')}>
                                <div className="flex items-center space-x-2">
                                  <span>Contact / ID</span>
                                  <i className={`fa-solid fa-sort ${sortConfig.key === 'id' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                                </div>
                             </th>
                             <th className="px-6 py-5 border-b border-slate-100 cursor-pointer group" onClick={() => handleSort('date')}>
                                <div className="flex items-center space-x-2">
                                  <span>Reg. Date</span>
                                  <i className={`fa-solid fa-sort ${sortConfig.key === 'date' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                                </div>
                             </th>
                             <th className="px-6 py-5 border-b border-slate-100 text-right">Records</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredPatients.map(p => {
                             const isExpanded = expandedPatientId === p.id;
                             const history = getPatientHistory(p.mobile);
                             const age = calculateAge(p.dob);
                             return (
                                <React.Fragment key={p.id}>
                                   <tr onClick={() => setExpandedPatientId(isExpanded ? null : p.id)} className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                                      <td className="px-6 py-5">
                                         <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 overflow-hidden">
                                               {p.photoUrl ? (
                                                 <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                               ) : (
                                                 p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                               )}
                                            </div>
                                            <div><p className="font-black text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">{p.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Age {age} • {p.isInPatient ? 'In-Patient' : 'Out-Patient'}</p></div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5"><div className="space-y-1"><p className="text-xs font-bold text-slate-700">{p.mobile}</p><p className="text-[10px] font-black text-blue-600 font-mono tracking-tighter">{p.id}</p></div></td>
                                      <td className="px-6 py-5"><div className="space-y-1"><p className="text-xs font-bold text-slate-800">{p.clinic}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.date}</p></div></td>
                                      <td className="px-6 py-5 text-right">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); setExpandedPatientId(isExpanded ? null : p.id); }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ml-auto ${
                                               isExpanded ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                            }`}
                                         >
                                            <i className={`fa-solid ${isExpanded ? 'fa-eye-slash' : 'fa-clock-rotate-left'} mr-2`}></i>
                                            {isExpanded ? 'Hide' : 'View History'}
                                            <span className="ml-2 w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center text-[8px]">{history.length}</span>
                                         </button>
                                      </td>
                                   </tr>
                                   {isExpanded && (
                                      <tr>
                                         <td colSpan={4} className="px-10 py-10 bg-white">
                                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-10">
                                               {/* Patient 360 Summary */}
                                               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                   <div className="p-2 border-2 border-slate-100 rounded-[2.5rem]">
                                                      <div className="w-full aspect-square rounded-[2.2rem] bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
                                                         {p.photoUrl ? (
                                                            <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                                         ) : (
                                                            <i className="fa-solid fa-user text-4xl text-slate-200"></i>
                                                         )}
                                                      </div>
                                                   </div>
                                                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Frequency Profile</p>
                                                      <div className="flex items-baseline space-x-2">
                                                         <span className="text-3xl font-black text-slate-900">{history.length}</span>
                                                         <span className="text-[10px] font-bold text-slate-500 uppercase">Lifetime Admissions</span>
                                                      </div>
                                                   </div>
                                                   <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex flex-col justify-between">
                                                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-4">Chronic History</p>
                                                      <div className="flex flex-wrap gap-2">
                                                         {Array.from(new Set(history.map(h => h.clinic))).map((c, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-white border border-blue-100 rounded-lg text-[8px] font-black uppercase text-blue-700">{c}</span>
                                                         ))}
                                                      </div>
                                                   </div>
                                                   <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
                                                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4">Adherence Status</p>
                                                      <div className="flex items-center space-x-2">
                                                         <i className="fa-solid fa-circle-check text-emerald-600"></i>
                                                         <span className="text-[10px] font-black text-emerald-700 uppercase">Profile Verified</span>
                                                      </div>
                                                   </div>
                                               </div>

                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                  {/* Visit Timeline */}
                                                  <div className="space-y-8">
                                                     <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center border-b border-slate-100 pb-4">
                                                        <i className="fa-solid fa-clock-rotate-left mr-3 text-blue-600"></i> Historical Visit Timeline
                                                     </h5>
                                                     <div className="relative pl-6 space-y-10 border-l-[3px] border-slate-100 ml-3">
                                                        {history.map((h, idx) => (
                                                           <div key={idx} className="relative">
                                                              <div className={`absolute -left-[33px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                                 {idx === 0 && <i className="fa-solid fa-star text-[8px] text-white"></i>}
                                                              </div>
                                                              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all cursor-default">
                                                                 <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{h.date} {idx === 0 ? '— Current/Recent' : ''}</p>
                                                                       <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Ref ID: {h.id}</p>
                                                                    </div>
                                                                    <div className="flex flex-col items-end space-y-1">
                                                                       <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-500">{h.clinic}</span>
                                                                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                          h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 
                                                                          h.status === 'REGISTERED' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                                                       }`}>
                                                                          {h.status}
                                                                       </span>
                                                                    </div>
                                                                 </div>
                                                                 <div className="space-y-4">
                                                                    <div>
                                                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Finding / Chief Complaint</p>
                                                                       <p className="text-xs text-slate-700 font-medium italic">"{h.condition || 'No description recorded.'}"</p>
                                                                    </div>
                                                                    {h.doctorNotes && (
                                                                       <div className="pt-3 border-t border-slate-200/50">
                                                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Physician Key Findings</p>
                                                                          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{h.doctorNotes}</p>
                                                                       </div>
                                                                    )}
                                                                 </div>
                                                              </div>
                                                           </div>
                                                        ))}
                                                     </div>
                                                  </div>

                                                  {/* Appointments & Engagement */}
                                                  <div className="space-y-8">
                                                     <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center border-b border-slate-100 pb-4">
                                                        <i className="fa-solid fa-calendar-check mr-3 text-emerald-600"></i> Scheduled Engagements
                                                     </h5>
                                                     <div className="space-y-4">
                                                        {history.flatMap(h => h.appointments).length > 0 ? (
                                                           history.flatMap(h => h.appointments).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((app, idx) => (
                                                              <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-emerald-500 transition-all">
                                                                 <div className="flex items-center space-x-5">
                                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                                                                       <i className="fa-solid fa-calendar-day"></i>
                                                                    </div>
                                                                    <div>
                                                                       <p className="text-xs font-black text-slate-900">{app.date} @ {app.time}</p>
                                                                       <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight mt-1">{app.reason}</p>
                                                                    </div>
                                                                 </div>
                                                                 <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
                                                              </div>
                                                           ))
                                                        ) : (
                                                           <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                                              <i className="fa-solid fa-calendar-xmark text-slate-100 text-4xl mb-6"></i>
                                                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Zero historical follow-ups</p>
                                                           </div>
                                                        )}
                                                     </div>

                                                     <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden mt-10">
                                                        <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fa-solid fa-folder-open text-7xl"></i></div>
                                                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 relative z-10">Historical Conditions List</h5>
                                                        <div className="flex flex-wrap gap-3 relative z-10">
                                                           {Array.from(new Set(history.map(h => h.condition).filter(Boolean))).map((cond, i) => (
                                                              <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold text-slate-300">{cond}</span>
                                                           ))}
                                                        </div>
                                                     </div>
                                                  </div>
                                               </div>

                                               <div className="pt-8 border-t border-slate-100 flex justify-end">
                                                  <button onClick={() => setExpandedPatientId(null)} className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95">Collapse Records</button>
                                               </div>
                                            </div>
                                         </td>
                                      </tr>
                                   )}
                                </React.Fragment>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-10 py-32 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <div className="animate-in fade-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 mx-auto border border-slate-100"><i className="fa-solid fa-user-slash text-slate-200 text-3xl"></i></div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching identities discovered</h4>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Try refining your search or clearing date filters.</p>
                    </div>
                 </div>
               )}
             </div>
             <div className="mt-8 flex items-center space-x-4"><div className="flex-1 h-[1px] bg-slate-100"></div><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Morning Star Hospital Central Registry</p><div className="flex-1 h-[1px] bg-slate-100"></div></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
