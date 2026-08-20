import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus, Appointment, User } from '../types';
import PatientMedicalRecordPrint, { calculateAge } from '../components/PatientMedicalRecordPrint';

interface DoctorModuleProps {
  patients: Patient[];
  allPatients?: Patient[];
  currentUser?: User | null;
  onUpdate: (patient: Patient) => void;
}

const TESTS = ['Complete Blood Count', 'Liver Function Test', 'Kidney Function', 'Urinalysis', 'Glucose fasting'];
const MEDS = ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Metformin 500mg', 'Lisinopril 10mg', 'Omeprazole 20mg'];
const XRAYS = ['Chest X-Ray', 'Abdominal X-Ray', 'Lumbosacral Spine', 'Skull PA/Lateral', 'Pelvis AP'];

const DoctorModule: React.FC<DoctorModuleProps> = ({ 
  patients, 
  allPatients = [], 
  currentUser, 
  onUpdate 
}) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [schedulingFollowUpPatient, setSchedulingFollowUpPatient] = useState<Patient | null>(null);
  const [printingPatient, setPrintingPatient] = useState<Patient | null>(null);
  
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'ARCHIVE'>('QUEUE');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveClinicFilter, setArchiveClinicFilter] = useState('ALL');
  const [showHistoryInConsultation, setShowHistoryInConsultation] = useState(false);

  const [notes, setNotes] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<string[]>([]);
  const [selectedXRay, setSelectedXRay] = useState<string[]>([]);
  
  // Consultation Follow-up state
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpReason, setFollowUpReason] = useState('');

  // Quick Scheduling states
  const [quickDate, setQuickDate] = useState('');
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickReason, setQuickReason] = useState('');

  // Ensure we have a pool of all patient records
  const masterPatientList = useMemo(() => {
    return allPatients && allPatients.length > 0 ? allPatients : patients;
  }, [allPatients, patients]);

  // Unique clinics list for filter
  const uniqueClinics = useMemo(() => {
    const set = new Set<string>();
    masterPatientList.forEach(p => { if (p.clinic) set.add(p.clinic); });
    return Array.from(set);
  }, [masterPatientList]);

  // Filtered archive list
  const filteredArchivePatients = useMemo(() => {
    const term = archiveSearch.toLowerCase().trim();
    return masterPatientList.filter(p => {
      const matchText = !term || (
        p.name.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        (p.mobile && p.mobile.includes(term)) ||
        (p.condition && p.condition.toLowerCase().includes(term))
      );
      const matchClinic = archiveClinicFilter === 'ALL' || p.clinic === archiveClinicFilter;
      return matchText && matchClinic;
    });
  }, [masterPatientList, archiveSearch, archiveClinicFilter]);

  // Previous visit history for currently selected patient in consultation
  const currentPatientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return masterPatientList.filter(p => 
      p.id !== selectedPatient.id && 
      ((p.mobile && selectedPatient.mobile && p.mobile === selectedPatient.mobile) ||
       (p.name.trim().toLowerCase() === selectedPatient.name.trim().toLowerCase() && p.dob === selectedPatient.dob))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatient, masterPatientList]);

  // Clinical Analytics
  const stats = useMemo(() => {
    const awaiting = patients.filter(p => p.status === PatientStatus.REGISTERED).length;
    const inConsult = patients.filter(p => p.status === (PatientStatus.WITH_DOCTOR as any)).length;
    return {
      awaiting,
      inConsult,
      avgTime: '14 mins',
      priorityCount: awaiting > 5 ? 'High' : 'Normal',
      totalRecords: masterPatientList.length
    };
  }, [patients, masterPatientList]);

  const handleStartConsultation = (p: Patient) => {
    setSelectedPatient(p);
    setNotes(p.doctorNotes || '');
    setSelectedTests(p.selectedTests || []);
    setSelectedMedicine(p.selectedMedicine || []);
    setSelectedXRay(p.selectedXRay || []);
    setShowHistoryInConsultation(false);
  };

  const handleConsultation = () => {
    if (!selectedPatient) return;

    let nextStatus = PatientStatus.COMPLETED;
    
    if (selectedMedicine.length > 0) {
      nextStatus = PatientStatus.IN_PHARMACY;
    }
    
    // Priority routing: Lab/X-Ray take precedence over Pharmacy for immediate next step
    if (selectedXRay.length > 0) {
      nextStatus = PatientStatus.IN_XRAY;
    }
    if (selectedTests.length > 0) {
      nextStatus = PatientStatus.IN_LAB;
    }

    const newAppointments = [...(selectedPatient.appointments || [])];
    if (hasFollowUp && followUpDate) {
      newAppointments.push({
        id: `APP-${Date.now().toString().slice(-6)}`,
        date: followUpDate,
        time: followUpTime,
        reason: followUpReason || 'Clinical Follow-up'
      });
    }

    const updated: Patient = {
      ...selectedPatient,
      doctorNotes: notes,
      selectedTests,
      selectedMedicine,
      selectedXRay,
      status: nextStatus,
      appointments: newAppointments
    };

    onUpdate(updated);
    alert(`Consultation finalized. ${hasFollowUp ? 'Follow-up appointment booked. ' : ''}Routing patient to: ${nextStatus}.`);
    
    // Reset states
    setSelectedPatient(null);
    setNotes('');
    setSelectedTests([]);
    setSelectedMedicine([]);
    setSelectedXRay([]);
    setHasFollowUp(false);
    setFollowUpDate('');
    setFollowUpTime('10:00');
    setFollowUpReason('');
  };

  const handleQuickSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingFollowUpPatient || !quickDate || !quickReason) return;

    const newAppointment: Appointment = {
      id: `APP-QS-${Date.now().toString().slice(-6)}`,
      date: quickDate,
      time: quickTime,
      reason: quickReason
    };

    const updated: Patient = {
      ...schedulingFollowUpPatient,
      appointments: [...schedulingFollowUpPatient.appointments, newAppointment]
    };

    onUpdate(updated);
    alert(`Follow-up scheduled successfully for ${schedulingFollowUpPatient.name} on ${quickDate}.`);
    
    // Reset quick states
    setSchedulingFollowUpPatient(null);
    setQuickDate('');
    setQuickTime('09:00');
    setQuickReason('');
  };

  // ================= RENDER: ACTIVE CONSULTATION TERMINAL =================
  if (selectedPatient) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto">
        <div className="bg-slate-900 p-6 sm:p-8 text-white flex flex-wrap justify-between items-center relative overflow-hidden gap-4">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <i className="fa-solid fa-user-md text-9xl"></i>
          </div>
          <div className="relative z-10 flex items-center space-x-4 sm:space-x-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
              {selectedPatient.photoUrl ? (
                <img src={selectedPatient.photoUrl} alt={selectedPatient.name} className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user-md text-2xl sm:text-3xl"></i>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none">{selectedPatient.name}</h3>
                <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {selectedPatient.isInPatient ? 'In-Patient' : 'Out-Patient'}
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
                PID: <span className="font-mono text-white font-bold">{selectedPatient.id}</span> • Age: {calculateAge(selectedPatient.dob)} • {selectedPatient.clinic}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 relative z-10 ml-auto">
            {/* Direct Print Patient Medical Record button */}
            <button 
              onClick={() => setPrintingPatient(selectedPatient)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
              title="Open Printable Medical History"
            >
              <i className="fa-solid fa-print"></i>
              <span className="hidden sm:inline">Print Medical Record</span>
            </button>

            {/* Toggle past visits during consultation */}
            {currentPatientHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryInConsultation(!showHistoryInConsultation)}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all border ${
                  showHistoryInConsultation 
                    ? 'bg-amber-500 text-white border-amber-500' 
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
                }`}
                title="View Past Medical Encounters"
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span className="hidden sm:inline">Prior Visits ({currentPatientHistory.length})</span>
              </button>
            )}

            <button 
              onClick={() => setSelectedPatient(null)} 
              className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 text-white transition-all border border-white/5"
              title="Close Consultation Terminal"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Prior Visits Banner / Drawer if toggled */}
        {showHistoryInConsultation && currentPatientHistory.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center">
                <i className="fa-solid fa-book-medical mr-2 text-amber-600"></i>
                Previous Medical Encounters for {selectedPatient.name}
              </h4>
              <button 
                onClick={() => setPrintingPatient(selectedPatient)}
                className="text-[10px] font-black text-amber-900 hover:text-amber-950 uppercase tracking-wider underline flex items-center"
              >
                <i className="fa-solid fa-print mr-1"></i> Print Full Consolidated History
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto custom-scrollbar">
              {currentPatientHistory.map((hist) => (
                <div key={hist.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{hist.date}</span>
                    <span className="text-[10px] text-blue-700 uppercase font-black">{hist.clinic}</span>
                  </div>
                  <p className="text-slate-600 italic text-[11px]">"{hist.condition || 'No specific complaint'}"</p>
                  {hist.doctorNotes && (
                    <p className="text-slate-800 text-[11px] font-medium bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                      <strong>Notes:</strong> {hist.doctorNotes}
                    </p>
                  )}
                  {hist.selectedMedicine && hist.selectedMedicine.length > 0 && (
                    <p className="text-emerald-700 text-[10px] font-bold">
                      <strong>Rx:</strong> {hist.selectedMedicine.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             {/* Left Column: Diagnostics */}
             <div className="lg:col-span-8 space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chief Complaint (Admission Record)</label>
                    {selectedPatient.isInPatient && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        Ward {selectedPatient.wardNumber || 'N/A'} • Bed {selectedPatient.bedNumber || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl italic text-slate-600 font-medium text-sm leading-relaxed">
                    "{selectedPatient.condition || "No specific complaint recorded."}"
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor's Clinical Notes & Diagnosis</label>
                    <button 
                      type="button"
                      onClick={() => setPrintingPatient(selectedPatient)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center"
                    >
                      <i className="fa-solid fa-print mr-1"></i> Preview Print Record
                    </button>
                  </div>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl h-48 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none font-medium text-sm transition-all"
                    placeholder="Document clinical findings, vitals, and treatment plan..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                      <i className="fa-solid fa-flask-vial mr-2 text-indigo-500"></i> Order Lab Investigations
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {TESTS.map(t => (
                        <label key={t} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedTests.includes(t) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                          <span className={`text-xs font-bold ${selectedTests.includes(t) ? 'text-indigo-700' : 'text-slate-600'}`}>{t}</span>
                          <input 
                            type="checkbox" 
                            checked={selectedTests.includes(t)}
                            onChange={(e) => e.target.checked ? setSelectedTests([...selectedTests, t]) : setSelectedTests(selectedTests.filter(i => i !== t))}
                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                      <i className="fa-solid fa-x-ray mr-2 text-blue-500"></i> Radiology (X-Ray) Orders
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {XRAYS.map(t => (
                        <label key={t} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedXRay.includes(t) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                          <span className={`text-xs font-bold ${selectedXRay.includes(t) ? 'text-blue-700' : 'text-slate-600'}`}>{t}</span>
                          <input 
                            type="checkbox" 
                            checked={selectedXRay.includes(t)}
                            onChange={(e) => e.target.checked ? setSelectedXRay([...selectedXRay, t]) : setSelectedXRay(selectedXRay.filter(i => i !== t))}
                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             {/* Right Column: Prescription & Follow-up */}
             <div className="lg:col-span-4 space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                    <i className="fa-solid fa-pills mr-2 text-emerald-500"></i> Pharmacy Prescription
                  </label>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-2">
                    {MEDS.map(t => (
                      <label key={t} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedMedicine.includes(t) ? 'bg-emerald-100/50 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <span className="text-xs font-bold">{t}</span>
                        <input 
                          type="checkbox" 
                          checked={selectedMedicine.includes(t)}
                          onChange={(e) => e.target.checked ? setSelectedMedicine([...selectedMedicine, t]) : setSelectedMedicine(selectedMedicine.filter(i => i !== t))}
                          className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Follow-up Reminder Section */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <i className="fa-solid fa-calendar-plus text-7xl"></i>
                   </div>
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">Clinical Follow-up</h4>
                      <button 
                        onClick={() => setHasFollowUp(!hasFollowUp)}
                        className={`w-12 h-6 rounded-full transition-all relative ${hasFollowUp ? 'bg-blue-600' : 'bg-slate-800'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasFollowUp ? 'right-1' : 'left-1'}`}></div>
                      </button>
                   </div>
                   
                   {hasFollowUp && (
                     <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                              <input 
                                type="date" 
                                value={followUpDate}
                                onChange={e => setFollowUpDate(e.target.value)}
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                              <input 
                                type="time" 
                                value={followUpTime}
                                onChange={e => setFollowUpTime(e.target.value)}
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Reason</label>
                           <textarea 
                              placeholder="e.g. Suture removal, lab review..."
                              value={followUpReason}
                              onChange={e => setFollowUpReason(e.target.value)}
                              className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-medium text-white h-20 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                           />
                        </div>
                     </div>
                   )}
                   {!hasFollowUp && <p className="text-xs text-slate-500 font-medium italic">No follow-up reminder set for this patient.</p>}
                </div>

                <div className="pt-8">
                  <button 
                    onClick={handleConsultation}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    FINALISE & DISCHARGE
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Modal for Printing within Terminal if triggered */}
        {printingPatient && (
          <PatientMedicalRecordPrint 
            patient={printingPatient} 
            allPatients={masterPatientList} 
            currentUser={currentUser} 
            onClose={() => setPrintingPatient(null)} 
          />
        )}
      </div>
    );
  }

  // ================= RENDER: DOCTOR MODULE HOME (QUEUE & ARCHIVE) =================
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Quick Schedule Modal */}
      {schedulingFollowUpPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm no-print" onClick={() => setSchedulingFollowUpPatient(null)}></div>
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 -mx-10 -mt-10 p-10 mb-8 text-white rounded-t-[3rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fa-solid fa-calendar-plus text-7xl"></i></div>
              <h3 className="text-xl font-black uppercase tracking-tight relative z-10">Schedule Follow-up</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 relative z-10">Patient: {schedulingFollowUpPatient.name}</p>
            </div>
            
            <form onSubmit={handleQuickSchedule} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appointment Date</label>
                  <input 
                    required 
                    type="date" 
                    value={quickDate}
                    onChange={e => setQuickDate(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time</label>
                  <input 
                    required 
                    type="time" 
                    value={quickTime}
                    onChange={e => setQuickTime(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Reason</label>
                <textarea 
                  required 
                  placeholder="e.g. Review lab results, post-op checkup..."
                  value={quickReason}
                  onChange={e => setQuickReason(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm h-28 resize-none outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setSchedulingFollowUpPatient(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Analytics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i className="fa-solid fa-people-group text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Doc</p>
            <h4 className="text-xl font-black text-slate-900">{stats.awaiting} Patients</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i className="fa-solid fa-user-md text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Cases</p>
            <h4 className="text-xl font-black text-slate-900">{stats.inConsult} Room 1</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="fa-solid fa-stopwatch text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg TAT</p>
            <h4 className="text-xl font-black text-slate-900">{stats.avgTime}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <i className="fa-solid fa-folder-tree text-xl text-blue-400"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital EMR Pool</p>
            <h4 className="text-xl font-black text-slate-900">{stats.totalRecords} Records</h4>
          </div>
        </div>
      </div>

      {/* Main Container with Tab Switcher */}
      <div className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-sm border border-slate-200">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <i className="fa-solid fa-stethoscope mr-3 text-blue-600"></i> Physician Clinical Desk
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Manage live clinical queues and view or print individual patient medical histories.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
                activeTab === 'QUEUE' 
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Waiting List ({patients.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ARCHIVE')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
                activeTab === 'ARCHIVE' 
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-folder-open"></i>
              <span>Patient Records & History ({masterPatientList.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ACTIVE WAITING LIST QUEUE */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Active Patients Awaiting Consultation ({patients.length})
              </h4>
              <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                <i className="fa-solid fa-print mr-1"></i> Medical History Printable for all patients
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {patients.map(p => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-[2.5rem] hover:shadow-2xl hover:border-blue-300 transition-all group relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="absolute top-0 right-0 p-6 sm:p-8 text-[9px] font-black text-slate-300 font-mono tracking-widest">{p.id}</div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500 overflow-hidden border border-slate-100">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fa-solid fa-user-injured text-2xl"></i>
                        )}
                      </div>
                    </div>

                    <h4 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors tracking-tight mb-1">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-4">
                      {p.clinic} • {p.isInPatient ? `In-Patient (W-${p.wardNumber || '1'})` : 'Out-Patient'}
                    </p>

                    {p.condition && (
                      <div className="mb-6 p-3 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 italic">
                        "{p.condition}"
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    <button 
                      onClick={() => handleStartConsultation(p)}
                      className="w-full py-3.5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-stethoscope"></i>
                      <span>Start Consultation</span>
                    </button>

                    {/* Dedicated Print Medical Record Button */}
                    <button 
                      onClick={() => setPrintingPatient(p)}
                      className="w-full py-3 bg-white border border-slate-300 hover:border-blue-500 text-slate-800 hover:text-blue-600 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center space-x-2 hover:bg-blue-50/50 active:scale-95"
                      title="Preview and Print Medical History"
                    >
                      <i className="fa-solid fa-print text-blue-600"></i>
                      <span>Print Medical Record</span>
                    </button>

                    <button 
                      onClick={() => setSchedulingFollowUpPatient(p)}
                      className="w-full py-2.5 text-slate-400 hover:text-slate-900 font-bold rounded-xl text-[9px] uppercase tracking-widest transition-all flex items-center justify-center space-x-1.5"
                    >
                      <i className="fa-solid fa-calendar-plus"></i>
                      <span>Schedule Follow-up</span>
                    </button>
                  </div>
                </div>
              ))}

              {patients.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-clipboard-list text-4xl text-slate-200 mb-4"></i>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Consultation queue is empty.</p>
                  <p className="text-xs text-slate-400 mt-1">You can search and print any patient's medical history in the "Patient Records & History" tab.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL PATIENTS MEDICAL RECORDS & HISTORY ARCHIVE */}
        {activeTab === 'ARCHIVE' && (
          <div className="space-y-6">
            
            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="md:col-span-8 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400 text-sm"></i>
                <input 
                  type="text"
                  placeholder="Search medical records by Patient Name, ID (e.g. P-1234), or Mobile..."
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-slate-800 transition-all"
                />
              </div>
              <div className="md:col-span-4">
                <select
                  value={archiveClinicFilter}
                  onChange={e => setArchiveClinicFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-slate-800"
                >
                  <option value="ALL">All Clinics & Specialties</option>
                  {uniqueClinics.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Archive List */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="py-4 px-4">Patient ID</th>
                    <th className="py-4 px-4">Patient Name & Demographics</th>
                    <th className="py-4 px-4">Clinic / Specialty</th>
                    <th className="py-4 px-4">Admission</th>
                    <th className="py-4 px-4">Latest Encounter</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Medical Record Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArchivePatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-4 px-4 font-mono font-bold text-blue-700">{p.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Age {calculateAge(p.dob)} • {p.mobile || 'No mobile'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-700">{p.clinic}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          p.isInPatient ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.isInPatient ? `In-Patient (W-${p.wardNumber || '1'})` : 'Out-Patient'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">{p.date}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          p.status === PatientStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700' :
                          p.status === PatientStatus.REGISTERED ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setPrintingPatient(p)}
                            className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
                            title="Print Comprehensive Medical History"
                          >
                            <i className="fa-solid fa-print"></i>
                            <span>Print Record</span>
                          </button>
                          
                          {(p.status === PatientStatus.REGISTERED || p.status === PatientStatus.WITH_DOCTOR) && (
                            <button
                              onClick={() => handleStartConsultation(p)}
                              className="px-3 py-2 bg-blue-50 text-blue-600 font-bold text-[10px] uppercase rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                              title="Begin Clinical Consultation"
                            >
                              Consult
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredArchivePatients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <i className="fa-solid fa-folder-open text-3xl mb-2 text-slate-300"></i>
                        <p className="text-[11px] font-bold uppercase tracking-wider">No patient records found matching your search</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Global Print Medical Record Modal */}
      {printingPatient && (
        <PatientMedicalRecordPrint 
          patient={printingPatient} 
          allPatients={masterPatientList} 
          currentUser={currentUser} 
          onClose={() => setPrintingPatient(null)} 
        />
      )}
    </div>
  );
};

export default DoctorModule;
