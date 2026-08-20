import React, { useState, useMemo } from 'react';
import { Patient, User } from '../types';

interface PatientMedicalRecordPrintProps {
  patient: Patient;
  allPatients?: Patient[];
  currentUser?: User | null;
  onClose: () => void;
}

export const calculateAge = (dob: string): number | string => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 'N/A';
};

const PatientMedicalRecordPrint: React.FC<PatientMedicalRecordPrintProps> = ({
  patient,
  allPatients = [],
  currentUser,
  onClose
}) => {
  // Filter options for customization before printing
  const [includeAllVisits, setIncludeAllVisits] = useState(true);
  const [includeLab, setIncludeLab] = useState(true);
  const [includeXRay, setIncludeXRay] = useState(true);
  const [includePharmacy, setIncludePharmacy] = useState(true);
  const [includeDoctorNotes, setIncludeDoctorNotes] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);

  // Retrieve all historical visits for this patient (matching by phone/mobile or patient ID)
  const historicalVisits = useMemo(() => {
    if (!allPatients || allPatients.length === 0) return [patient];
    
    const matched = allPatients.filter(p => 
      p.id === patient.id || 
      (p.mobile && patient.mobile && p.mobile === patient.mobile) ||
      (p.name.trim().toLowerCase() === patient.name.trim().toLowerCase() && p.dob === patient.dob)
    );

    if (matched.length === 0) return [patient];

    // Sort chronologically descending (newest first)
    return [...matched].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patient, allPatients]);

  const handlePrint = () => {
    window.print();
  };

  const printDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-8">
      
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print fixed top-4 inset-x-4 max-w-4xl mx-auto z-[160] bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <i className="fa-solid fa-print text-lg"></i>
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight">Print Patient Medical Record</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {patient.name} • PID: <span className="font-mono text-blue-400 font-bold">{patient.id}</span>
            </p>
          </div>
        </div>

        {/* Print Configuration Checkboxes */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-semibold text-slate-300">
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={includeAllVisits} 
              onChange={e => setIncludeAllVisits(e.target.checked)} 
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
            />
            <span>All Historical Visits ({historicalVisits.length})</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={includeLab} 
              onChange={e => setIncludeLab(e.target.checked)} 
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
            />
            <span>Labs</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={includeXRay} 
              onChange={e => setIncludeXRay(e.target.checked)} 
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
            />
            <span>Imaging</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white">
            <input 
              type="checkbox" 
              checked={includePharmacy} 
              onChange={e => setIncludePharmacy(e.target.checked)} 
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500"
            />
            <span>Rx</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 ml-auto">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
            title="Open Print Dialog"
          >
            <i className="fa-solid fa-print"></i>
            <span>Print Document</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Printable Sheet (Formatted for standard A4 document printing) */}
      <div className="print-container w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 md:p-12 my-16 md:my-20 border border-slate-200 transition-all font-sans print:shadow-none print:m-0 print:p-0 print:border-none print:rounded-none">
        
        {/* ================= HEADER / LETTERHEAD ================= */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md print:border print:border-black">
                <i className="fa-solid fa-star text-3xl text-amber-400"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 font-serif leading-none">
                  Morning Star Hospital
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mt-1">
                  Your Health is our PRIORITY • 24 Hours Service Everyday
                </p>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Freetown, Sierra Leone • Tel: +232 73 929 145, +232 78 355 293 • records@morningstarhospital.sl
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800">
                Official Medical Record
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1.5">Doc Ref: <strong className="text-slate-800">MR-{patient.id}-{Date.now().toString().slice(-4)}</strong></p>
              <p className="text-[10px] text-slate-500 font-mono">Issued: {printDate} {printTime}</p>
            </div>
          </div>
        </div>

        {/* ================= PATIENT SUMMARY / DEMOGRAPHICS ================= */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 sm:p-5 mb-6 print-break-inside-avoid print:bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
              <i className="fa-solid fa-id-card text-blue-600 mr-2"></i> Patient Demographic & Registration Profile
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              Total Recorded Encounters: <strong className="text-slate-900 font-bold">{historicalVisits.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient ID (PID)</span>
              <span className="font-black font-mono text-blue-800 text-sm">{patient.id}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth / Age</span>
              <span className="font-bold text-slate-800">{patient.dob || 'Not stated'} ({calculateAge(patient.dob)} yrs)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Mobile</span>
              <span className="font-bold font-mono text-slate-800">{patient.mobile || 'None recorded'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Clinic</span>
              <span className="font-bold text-slate-800">{patient.clinic}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admission Type</span>
              <span className={`inline-block font-black text-[11px] uppercase ${patient.isInPatient ? 'text-indigo-700' : 'text-slate-700'}`}>
                {patient.isInPatient ? 'In-Patient (Admitted)' : 'Out-Patient'}
              </span>
            </div>
            {patient.isInPatient && (
              <>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ward / Floor</span>
                  <span className="font-bold text-slate-800">Ward {patient.wardNumber || 'N/A'}, Floor {patient.floor || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bed Number</span>
                  <span className="font-bold text-slate-800">Bed {patient.bedNumber || 'N/A'}</span>
                </div>
              </>
            )}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initial Reg. Date</span>
              <span className="font-bold text-slate-800">{patient.date}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
              <span className="font-bold text-slate-800">{patient.status}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attending Provider</span>
              <span className="font-bold text-slate-800">{currentUser ? currentUser.name : 'Dr. Medical Staff'}</span>
            </div>
          </div>
        </div>

        {/* ================= CLINICAL ENCOUNTERS & MEDICAL HISTORY ================= */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
              <i className="fa-solid fa-file-medical text-blue-700 mr-2"></i>
              {includeAllVisits ? 'Chronological Medical Encounters & Clinical History' : 'Current Clinical Encounter Record'}
            </h2>
            <span className="text-[10px] text-slate-500 italic">
              {includeAllVisits ? `Showing ${historicalVisits.length} recorded visit(s)` : `Visit Date: ${patient.date}`}
            </span>
          </div>

          {/* Visits List */}
          {(includeAllVisits ? historicalVisits : [patient]).map((visit, vIdx) => {
            const isCurrentEncounter = visit.id === patient.id;
            const hasLab = (visit.selectedTests && visit.selectedTests.length > 0) || (visit.labResults && visit.labResults.length > 0);
            const hasXRay = (visit.selectedXRay && visit.selectedXRay.length > 0) || (visit.xRayResults && visit.xRayResults.length > 0);
            const hasMeds = (visit.selectedMedicine && visit.selectedMedicine.length > 0) || (visit.pharmacySales && visit.pharmacySales.length > 0);
            const hasAppointments = visit.appointments && visit.appointments.length > 0;

            return (
              <div 
                key={visit.id || vIdx} 
                className="border border-slate-300 rounded-xl p-5 mb-5 bg-white print-break-inside-avoid print:border-slate-400"
              >
                {/* Visit Subheader */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 mb-4 bg-slate-50/80 -mx-5 -mt-5 p-4 rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {vIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Visit Date: {visit.date} • <span className="text-blue-700">{visit.clinic}</span>
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 font-bold">
                        Encounter Ref: {visit.id} {isCurrentEncounter && <span className="text-emerald-700 font-sans font-black uppercase ml-1">(Primary / Current)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg text-[10px] font-black uppercase">
                      Status: {visit.status}
                    </span>
                  </div>
                </div>

                {/* 1. Chief Complaint */}
                <div className="mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Presenting Chief Complaint / Condition
                  </span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 italic">
                    "{visit.condition || 'No specific chief complaint recorded for this visit.'}"
                  </div>
                </div>

                {/* 2. Doctor Clinical Assessment & Notes */}
                {includeDoctorNotes && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Physician Examination Findings, Clinical Notes & Diagnosis
                    </span>
                    <div className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-lg text-xs font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {visit.doctorNotes || (
                        <span className="italic text-slate-400">Clinical notes pending documentation by attending doctor.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Diagnostic Investigations (Labs) */}
                {includeLab && hasLab && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center mb-1.5">
                      <i className="fa-solid fa-flask text-blue-600 mr-1.5"></i> Laboratory Diagnostics & Findings
                    </span>
                    
                    {visit.labResults && visit.labResults.length > 0 ? (
                      <div className="space-y-3">
                        {visit.labResults.map((lr, lIdx) => (
                          <div key={lIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                            <div className="bg-slate-100 px-3 py-1.5 flex justify-between items-center text-xs font-bold text-slate-800">
                              <span>Test: {lr.testName}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                lr.overallStatus === 'Critical' ? 'bg-rose-100 text-rose-800' :
                                lr.overallStatus === 'Abnormal' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                Overall: {lr.overallStatus || 'Normal'}
                              </span>
                            </div>
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                                  <th className="py-1.5 px-3">Parameter</th>
                                  <th className="py-1.5 px-3">Observed Result</th>
                                  <th className="py-1.5 px-3">Reference Range</th>
                                  <th className="py-1.5 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lr.parameters.map((param, pIdx) => (
                                  <tr key={pIdx} className="border-b border-slate-100 last:border-0 text-slate-700">
                                    <td className="py-1.5 px-3 font-semibold">{param.name || 'Standard Index'}</td>
                                    <td className="py-1.5 px-3 font-bold text-slate-900">
                                      {param.value ? `${param.value} ${param.unit}` : 'Pending analysis'}
                                    </td>
                                    <td className="py-1.5 px-3 font-mono text-slate-500">
                                      {param.min || param.max ? `${param.min || '0'} - ${param.max || 'N/A'} ${param.unit}` : 'Standard'}
                                    </td>
                                    <td className="py-1.5 px-3 text-right">
                                      <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded ${
                                        param.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                        param.status === 'Abnormal' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {param.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <span className="font-bold text-slate-700">Ordered Laboratory Investigations: </span>
                        <span className="text-slate-800">{visit.selectedTests.join(', ')}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">(Results awaiting completion/specimen analysis)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Radiology & Imaging (X-Ray) */}
                {includeXRay && hasXRay && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center mb-1.5">
                      <i className="fa-solid fa-x-ray text-indigo-600 mr-1.5"></i> Diagnostic Radiology & Imaging
                    </span>
                    
                    {visit.xRayResults && visit.xRayResults.length > 0 ? (
                      <div className="space-y-2">
                        {visit.xRayResults.map((xr, xIdx) => (
                          <div key={xIdx} className="p-3 bg-indigo-50/30 border border-indigo-200 rounded-lg text-xs">
                            <div className="flex justify-between items-center font-bold text-slate-900 border-b border-indigo-100 pb-1 mb-1.5">
                              <span>Modality/View: {xr.viewName}</span>
                              {xr.technician && <span className="text-[10px] font-normal text-slate-500">Tech: {xr.technician}</span>}
                            </div>
                            <p className="text-slate-800 mt-1"><strong>Radiological Findings:</strong> {xr.findings || 'No acute abnormalities noted.'}</p>
                            {xr.impression && (
                              <p className="text-indigo-900 font-semibold mt-1"><strong>Impression:</strong> {xr.impression}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <span className="font-bold text-slate-700">Requested Imaging Views: </span>
                        <span className="text-slate-800">{visit.selectedXRay.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Medications & Pharmacy Prescriptions */}
                {includePharmacy && hasMeds && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center mb-1.5">
                      <i className="fa-solid fa-pills text-emerald-600 mr-1.5"></i> Prescribed Therapeutic Regimens & Medications
                    </span>

                    {visit.pharmacySales && visit.pharmacySales.length > 0 ? (
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-600 border-b border-slate-200">
                            <th className="py-1.5 px-3">Medication / Item</th>
                            <th className="py-1.5 px-3">Form / Classification</th>
                            <th className="py-1.5 px-3 text-center">Dispensed Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visit.pharmacySales.map((ps, psIdx) => (
                            <tr key={psIdx} className="border-b border-slate-100 last:border-0 text-slate-800">
                              <td className="py-1.5 px-3 font-bold">{ps.item}</td>
                              <td className="py-1.5 px-3 text-slate-500">{ps.type || 'Oral Tablet/Suspension'}</td>
                              <td className="py-1.5 px-3 text-center font-bold font-mono">{ps.quantity} Units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs flex flex-wrap gap-2">
                        {visit.selectedMedicine.map((med, mIdx) => (
                          <span key={mIdx} className="px-2.5 py-1 bg-white border border-emerald-300 rounded-md font-bold text-emerald-900 text-xs">
                            <i className="fa-solid fa-prescription mr-1 text-emerald-600"></i> {med}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Scheduled Follow-up Appointments */}
                {includeAppointments && hasAppointments && (
                  <div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center mb-1.5">
                      <i className="fa-solid fa-calendar-check text-blue-600 mr-1.5"></i> Scheduled Clinical Follow-up
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visit.appointments.map((app, aIdx) => (
                        <div key={aIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>Date: {app.date}</span>
                            <span className="font-mono text-blue-700">{app.time}</span>
                          </div>
                          <p className="text-slate-600 mt-1 text-[11px]">Reason: <span className="font-semibold text-slate-800">{app.reason}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================= PHYSICIAN SIGNATURE & STAMP ATTESTATION ================= */}
        <div className="mt-10 pt-6 border-t-2 border-slate-900 print-break-inside-avoid">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-end">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Attending Medical Officer</p>
              <p className="text-xs font-bold text-slate-900">{currentUser ? currentUser.name : 'Dr. Medical Officer'}</p>
              <p className="text-[10px] text-slate-500 uppercase">{currentUser ? currentUser.role : 'Physician'} • MSH Clinical Staff</p>
              <div className="mt-8 border-b border-slate-400 w-44"></div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">Doctor Signature & Date</p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hospital Verification</p>
              <div className="w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                <i className="fa-solid fa-stamp text-slate-300 text-lg mb-1"></i>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Official Medical Records Seal</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security & Legal Notice</p>
              <p className="text-[9px] text-slate-500 leading-tight mt-1">
                This document is a certified copy of the patient medical history on record at Morning Star Hospital. Protected under Medical Confidentiality Laws.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientMedicalRecordPrint;
