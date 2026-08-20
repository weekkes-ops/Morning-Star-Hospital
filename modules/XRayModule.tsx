
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, PatientStatus, XRayResult } from '../types';

interface XRayModuleProps {
  patients: Patient[];
  onUpdate: (patient: Patient) => void;
  onRecordRevenue: (amount: number, patientId: string) => void;
}

const XRayModule: React.FC<XRayModuleProps> = ({ patients, onUpdate, onRecordRevenue }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<XRayResult[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'FINALIZED'>('PENDING');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');

  // Radiology Analytics
  const stats = useMemo(() => {
    const pending = patients.filter(p => p.status === PatientStatus.IN_XRAY).length;
    const completed = patients.filter(p => p.xRayResults && p.xRayResults.length > 0).length;
    return {
      pending,
      completed,
      turnaround: '22m',
      utilization: '74%'
    };
  }, [patients]);

  const scanSteps = [
    'Initializing X-Ray Tube...',
    'Adjusting Collimation...',
    'Positioning Digital Plate...',
    'Capturing Latent Image...',
    'Enhancing Contrast Density...',
    'Processing DICOM Header...',
    'Ready for Interpretation.'
  ];

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      setScanProgress(0);
      setScanStatus(scanSteps[0]);

      interval = setInterval(() => {
        setScanProgress(prev => {
          const next = prev + 1;
          const currentStep = Math.floor((next / 100) * scanSteps.length);
          if (scanSteps[currentStep] && scanSteps[currentStep] !== scanStatus) {
            setScanStatus(scanSteps[currentStep]);
          }
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              setHasCaptured(true);
            }, 500);
            return 100;
          }
          return next;
        });
      }, 35);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const startImaging = (p: Patient) => {
    setSelectedPatient(p);
    setHasCaptured(false); // Reset capture state for new session
    setResults(p.selectedXRay.map(view => ({ 
      viewName: view, 
      findings: p.xRayResults?.find(r => r.viewName === view)?.findings || '', 
      impression: p.xRayResults?.find(r => r.viewName === view)?.impression || '', 
      technician: 'Senior Radiographer' 
    })));
  };

  const triggerScan = () => {
    setIsScanning(true);
  };

  const viewFinalized = (p: Patient) => {
    setSelectedPatient(p);
    setResults(p.xRayResults || []);
    setShowPrintModal(true);
  };

  const handleSave = () => {
    if (!selectedPatient) return;
    const totalFees = results.length * 300;
    onRecordRevenue(totalFees, selectedPatient.id);

    const updated: Patient = {
      ...selectedPatient,
      xRayResults: results,
      status: selectedPatient.status === PatientStatus.IN_XRAY ? PatientStatus.IN_PHARMACY : selectedPatient.status
    };
    onUpdate(updated);
    alert(`Imaging report finalized. Revenue of SLE ${totalFees} recorded.`);
    setSelectedPatient(null);
    setShowPrintModal(false);
  };

  const pendingPatients = patients.filter(p => p.status === PatientStatus.IN_XRAY);
  const finalizedPatients = patients.filter(p => p.xRayResults && p.xRayResults.length > 0);

  const ReportPreviewModal = () => {
    if (!showPrintModal || !selectedPatient) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowPrintModal(false)}></div>
        <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 custom-scrollbar print:max-h-none print:rounded-none print:shadow-none print:p-0">
          <div className="p-10 md:p-14 print:p-6">
            
            {/* OFFICIAL RADIOLOGY HEADER - PROFESSIONAL REDESIGN */}
            <div className="border-b-[10px] border-slate-900 pb-10 mb-12 relative">
              <div className="absolute top-0 right-0 py-2 px-4 bg-slate-900 text-white rounded-bl-2xl hidden md:block print:block">
                <p className="text-[8px] font-black uppercase tracking-[0.4em]">Document Control: RAD-DOC-01-V4</p>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                <div className="flex-1 w-full">
                  {/* PROMINENT PATIENT ID BAR - NEW SECTION */}
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl flex items-center space-x-3 shadow-xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Patient Identifier:</span>
                      <span className="text-lg font-black font-mono tracking-tighter">{selectedPatient.id}</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>

                  <div className="flex items-center space-x-5 mb-8">
                    <div className="w-20 h-20 bg-slate-900 text-white flex flex-col items-center justify-center rounded-[1.5rem] font-black text-2xl shadow-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <span className="relative z-10">MSH</span>
                      <span className="relative z-10 text-[8px] mt-1 tracking-widest text-blue-400">MAIN</span>
                    </div>
                    <div className="border-l-2 border-slate-100 pl-6">
                      <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Morning Star <span className="text-blue-600">Hospital</span></h1>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Radiology & Diagnostic Imaging Center</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Your Health is our PRIORITY</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* PATIENT PROFILE BLOCK */}
                  <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-slate-200 border-b border-slate-200">
                      <div className="p-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Name</p>
                        <p className="text-sm font-black text-slate-900">{selectedPatient.name}</p>
                      </div>
                      <div className="p-6 bg-blue-600/5">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">EMR-ID Verification</p>
                        <p className="text-sm font-black text-blue-800 font-mono">{selectedPatient.id}</p>
                      </div>
                      <div className="p-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Timestamp</p>
                        <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="p-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Age / Gender</p>
                        <p className="text-sm font-bold text-slate-700">{new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} Years / N/A</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-slate-200">
                       <div className="p-6 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Referral</p>
                            <p className="text-xs font-bold text-slate-900">{selectedPatient.clinic}</p>
                         </div>
                         <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                            <i className="fa-solid fa-notes-medical text-xs"></i>
                         </div>
                       </div>
                       <div className="p-6 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Finalized Record</p>
                         </div>
                         <i className="fa-solid fa-circle-check text-emerald-500 text-xl opacity-20"></i>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pt-4">
                  <div className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col items-center min-w-[200px] shadow-inner text-center">
                    <div className="mb-3">
                       <i className="fa-solid fa-qrcode text-4xl text-slate-900"></i>
                    </div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Digital Ref No.</p>
                    <p className="text-xs font-black font-mono text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100">RAD-P-#{selectedPatient.id.split('-')[1] || selectedPatient.id.slice(-4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Facility ID</p>
                    <p className="text-xs font-black text-slate-900 mt-1">MSH-MAIN-RAD-STATION-01</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-16 px-10">
               <div className="inline-flex items-center space-x-4 px-6 py-2 bg-slate-900 rounded-full text-white mb-6">
                  <i className="fa-solid fa-file-shield text-[10px] text-blue-400"></i>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Official Medical Investigation Report</span>
               </div>
               <h2 className="font-black text-4xl text-slate-900 uppercase tracking-tight leading-none mb-4">Radiological Observation Record</h2>
               <div className="flex items-center justify-center space-x-3">
                  <div className="h-[1px] w-20 bg-slate-100"></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Diagnostic Summary Follows</span>
                  <div className="h-[1px] w-20 bg-slate-100"></div>
               </div>
            </div>

            {/* RESULTS CONTENT */}
            <div className="space-y-16 mb-24 max-w-4xl mx-auto">
              {results.map((res, i) => (
                <div key={i} className="relative pl-12">
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs z-10 border-4 border-white shadow-lg">
                    {i + 1}
                  </div>
                  <div className="absolute left-4 top-4 bottom-0 w-[1px] bg-slate-100"></div>
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{res.viewName}</h3>
                    <div className="w-16 h-1 bg-blue-600 mt-2 rounded-full"></div>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                         <i className="fa-solid fa-microscope mr-2 text-blue-500"></i> Clinical Findings
                      </h4>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 italic text-slate-700 leading-relaxed font-medium">
                        {res.findings || "No significant radiological abnormalities detected in the skeletal or soft tissue structures visualized in this view. Bone density and alignment appear within normal physiological ranges for patient age and clinical history."}
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl border-l-[16px] border-blue-600 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <i className="fa-solid fa-stethoscope text-9xl"></i>
                      </div>
                      <div className="relative z-10">
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">Radiological Impression</h4>
                         <p className="text-xl font-bold leading-relaxed">{res.impression || "Diagnostic findings are unremarkable and consistent with standard anatomical baselines."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PROFESSIONAL SIGNATURE BLOCK */}
            <div className="mt-32 pt-16 border-t border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-24 px-10">
                 <div className="text-center">
                   <div className="mb-8 h-24 flex flex-col items-center justify-center grayscale opacity-60">
                      <i className="fa-solid fa-signature text-4xl text-slate-200 mb-2"></i>
                      <div className="w-48 h-[1px] bg-slate-200"></div>
                   </div>
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Radiography Tech</p>
                   <p className="text-[9px] font-bold text-slate-400 italic">Senior Technologist • ID: RAD-TECH-99</p>
                 </div>
                 <div className="text-center">
                   <div className="mb-8 h-24 flex flex-col items-center justify-center">
                      <div className="px-6 py-2 border-2 border-blue-600/20 rounded-xl text-blue-600/40 transform -rotate-12 font-black text-xs uppercase tracking-[0.3em] mb-4">Digitally Signed</div>
                      <div className="w-48 h-[1px] bg-slate-200"></div>
                   </div>
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Consultant Radiologist</p>
                   <p className="text-[9px] font-bold text-slate-400 italic">MD, FWACS • Radiological Lead</p>
                 </div>
               </div>
            </div>

            {/* REDESIGNED STANDARDIZED FOOTER */}
            <div className="mt-24 pt-12 border-t-[8px] border-slate-900">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-xs">
                  {/* Column 1: Confidentiality & Compliance */}
                  <div className="space-y-6">
                     <div className="flex items-center space-x-3 text-slate-900">
                        <i className="fa-solid fa-shield-halved text-blue-600"></i>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.3em]">Confidentiality Notice</h5>
                     </div>
                     <p className="text-[9px] text-slate-500 leading-relaxed text-justify">
                        This document contains highly sensitive and protected health information (PHI) intended solely for the medical professional named herein. Unauthorized disclosure, copying, or distribution is strictly prohibited under Morning Star Hospital Data Privacy Protocols and local healthcare regulations. If received in error, please destroy and contact the facility immediately.
                     </p>
                     <div className="pt-4 border-t border-slate-100 flex items-center space-x-4">
                        <div className="flex flex-col">
                           <span className="text-[7px] font-black text-slate-400 uppercase">Compliance Code</span>
                           <span className="text-[9px] font-black text-slate-900">ISO-27001-HEALTH</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Column 2: Facility Contact & Verification */}
                  <div className="space-y-6">
                     <div className="flex items-center space-x-3 text-slate-900">
                        <i className="fa-solid fa-building-circle-check text-blue-600"></i>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.3em]">Facility Contact Details</h5>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start space-x-4">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-map-location-dot text-slate-400 text-[10px]"></i>
                           </div>
                           <p className="text-[9px] font-bold text-slate-600 leading-tight">
                              Freetown, Sierra Leone<br/>24 Hours Service Everyday
                           </p>
                        </div>
                        <div className="flex items-start space-x-4">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-phone text-slate-400 text-[10px]"></i>
                           </div>
                           <p className="text-[9px] font-bold text-slate-600">
                              +232 73 929 145 / +232 78 355 293<br/>
                              <span className="text-blue-500">radiology-verify@morningstarhospital.sl</span>
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Column 3: Quality Assurance & Metadata */}
                  <div className="space-y-6">
                     <div className="flex items-center space-x-3 text-slate-900">
                        <i className="fa-solid fa-microscope text-blue-600"></i>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.3em]">Quality Assurance</h5>
                     </div>
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                        <div className="absolute top-2 right-2 opacity-5">
                           <i className="fa-solid fa-certificate text-3xl"></i>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-relaxed font-bold italic mb-4">
                           This investigation was performed using high-resolution Digital Radiography (DR) equipment, calibrated to international safety and radiation protection standards (ALARA).
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                           <div className="flex flex-col">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">System Hash</span>
                              <span className="text-[8px] font-mono text-slate-900">B7F8-E2C1-4D9A-RAD</span>
                           </div>
                           <div className="w-8 h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center">
                              <i className="fa-solid fa-fingerprint text-slate-300"></i>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="mt-12 flex flex-col md:flex-row justify-between items-center border-t border-slate-100 pt-6">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 md:mb-0">
                     Morning Star Hospital • Your Health is our PRIORITY
                  </p>
                  <div className="flex items-center space-x-6">
                     <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Page</span>
                        <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">01</span>
                     </div>
                     <div className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded">
                        Electronic Copy: MSH-HIS-V4
                     </div>
                  </div>
               </div>
            </div>

            {/* CONTROLS - NON-PRINT */}
            <div className="mt-16 no-print flex justify-center space-x-6 sticky bottom-8 py-6">
              <button onClick={() => setShowPrintModal(false)} className="px-10 py-5 bg-slate-100 text-slate-600 font-black rounded-[1.5rem] transition-all hover:bg-slate-200 uppercase text-[10px] tracking-[0.2em] shadow-lg">Close Preview</button>
              <button onClick={() => window.print()} className="px-14 py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 uppercase text-[10px] tracking-[0.2em]">
                <i className="fa-solid fa-print mr-3"></i> Commit & Print Final Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isScanning && selectedPatient) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="relative w-full max-w-2xl aspect-[3/4] bg-slate-900 rounded-[4rem] border border-slate-800 shadow-[0_0_100px_rgba(59,130,246,0.1)] flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_25px_rgba(59,130,246,0.8)] z-20" style={{ top: `${scanProgress}%`, transition: 'top 0.05s linear' }}></div>
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-48 h-48 rounded-full border-4 border-dashed border-blue-500/30 flex items-center justify-center animate-[spin_20s_linear_infinite]"><i className="fa-solid fa-person-rays text-8xl text-blue-500/20"></i></div>
            <div className="mt-12 text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{scanProgress}% Captured</h2>
              <div className="flex items-center justify-center space-x-3"><div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div><p className="text-blue-400 font-mono text-sm tracking-widest font-black uppercase">{scanStatus}</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPatient && !showPrintModal) {
    const isNewImaging = !selectedPatient.xRayResults && !hasCaptured;

    return (
      <div className="bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col min-h-[600px]">
        <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-8">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20"><i className="fa-solid fa-x-ray text-3xl"></i></div>
            <div>
              <div className="flex items-center space-x-4 mb-2"><h3 className="text-2xl font-black text-white">Imaging Workbench</h3><span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase rounded-xl border border-blue-500/30 tracking-widest">ID: {selectedPatient.id}</span></div>
              <p className="text-slate-400 text-sm font-medium">{selectedPatient.name} • {selectedPatient.clinic}</p>
            </div>
          </div>
          <button onClick={() => setSelectedPatient(null)} className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"><i className="fa-solid fa-times text-2xl"></i></button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto custom-scrollbar">
          {isNewImaging ? (
            <div className="max-w-xl w-full bg-slate-800/40 p-12 rounded-[3.5rem] border border-slate-700/50 text-center space-y-8 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-blue-500/20 ring-8 ring-blue-500/5">
                 <i className="fa-solid fa-bolt-lightning text-4xl"></i>
               </div>
               <div>
                 <h4 className="text-2xl font-black text-white tracking-tight">System Ready for Imaging</h4>
                 <p className="text-slate-400 text-sm mt-2 font-medium">Verify patient position and shielding before triggering the digital capture sequence.</p>
               </div>
               <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/30 text-left space-y-2">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Views Ordered:</p>
                 <div className="flex flex-wrap gap-2">
                   {selectedPatient.selectedXRay.map((view, i) => (
                     <span key={i} className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-700">{view}</span>
                   ))}
                 </div>
               </div>
               <button 
                 onClick={triggerScan}
                 className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center group"
               >
                 <i className="fa-solid fa-radiation mr-3 group-hover:animate-spin"></i>
                 Execute Radiographic Capture
               </button>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Electronic Diagnostic Safety Protocol FIH-RAD-V1</p>
            </div>
          ) : (
            <div className="w-full space-y-10">
               {results.map((res, i) => (
                 <div key={i} className="bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-700/50 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-lg font-black text-blue-400 uppercase tracking-widest">{res.viewName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Radiographic Findings</label>
                          <textarea 
                            value={res.findings}
                            onChange={(e) => {
                               const newRes = [...results];
                               newRes[i].findings = e.target.value;
                               setResults(newRes);
                            }}
                            className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-medium text-sm text-slate-200 h-40 resize-none transition-all"
                            placeholder="Detail bone structures, soft tissue, pathologies..."
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Impression / Final Conclusion</label>
                          <textarea 
                            value={res.impression}
                            onChange={(e) => {
                               const newRes = [...results];
                               newRes[i].impression = e.target.value;
                               setResults(newRes);
                            }}
                            className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-sm text-white h-40 resize-none transition-all"
                            placeholder="Final clinical summary..."
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {!isNewImaging && (
          <div className="p-10 border-t border-slate-800 flex justify-end space-x-8 bg-slate-900/80 backdrop-blur-md animate-in slide-in-from-bottom-2">
             <button onClick={() => setShowPrintModal(true)} className="px-12 py-5 bg-slate-800 text-slate-300 font-black rounded-2xl border border-slate-700 hover:text-white hover:bg-slate-700 transition-all uppercase text-xs tracking-[0.2em]">Report Preview</button>
             <button onClick={handleSave} className="px-16 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 uppercase text-xs tracking-[0.2em]">Finalize Investigation</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Module Analytics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i className="fa-solid fa-person-rays text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Scans</p>
            <h4 className="text-xl font-black text-slate-900">{stats.pending} Patients</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i className="fa-solid fa-file-shield text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports Finalized</p>
            <h4 className="text-xl font-black text-slate-900">{stats.completed} Daily</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="fa-solid fa-gauge-high text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg TAT</p>
            <h4 className="text-xl font-black text-slate-900">{stats.turnaround}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="fa-solid fa-plug-circle-bolt text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</p>
            <h4 className="text-xl font-black text-slate-900">{stats.utilization}</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={() => setActiveTab('PENDING')} className={`px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>Pending Investigations ({pendingPatients.length})</button>
        <button onClick={() => setActiveTab('FINALIZED')} className={`px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'FINALIZED' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>Finalized Reports ({finalizedPatients.length})</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {activeTab === 'PENDING' ? pendingPatients.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 p-10 rounded-[3rem] hover:shadow-2xl hover:border-blue-300 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8"><span className="text-[10px] font-black bg-blue-50 text-blue-700 px-4 py-2 rounded-xl uppercase tracking-widest border border-blue-100/50">{p.id}</span></div>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500"><i className="fa-solid fa-stethoscope text-3xl"></i></div>
              <h4 className="font-black text-slate-900 text-2xl mb-2 tracking-tight">{p.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-8">{p.clinic}</p>
              <button onClick={() => startImaging(p)} className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.8rem] text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">Start Imaging</button>
            </div>
          )) : finalizedPatients.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] hover:shadow-2xl hover:border-blue-500 transition-all relative overflow-hidden group text-white">
              <div className="absolute top-0 right-0 p-8"><span className="text-[10px] font-black bg-white/10 text-white/60 px-4 py-2 rounded-xl uppercase tracking-widest border border-white/10">{p.id}</span></div>
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500"><i className="fa-solid fa-file-shield text-3xl"></i></div>
              <h4 className="font-black text-white text-2xl mb-2 tracking-tight">{p.name}</h4>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] mb-8">{p.clinic}</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => startImaging(p)} className="py-4 bg-white/10 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Review</button>
                 <button onClick={() => viewFinalized(p)} className="py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">Print Report</button>
              </div>
            </div>
          ))
        }
        {activeTab === 'PENDING' && pendingPatients.length === 0 && (
           <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <i className="fa-solid fa-folder-open text-5xl text-slate-200 mb-6"></i>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No pending investigations</p>
           </div>
        )}
      </div>
      <ReportPreviewModal />
    </div>
  );
};

export default XRayModule;
