
import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus, LabResult, LabParameter } from '../types';

interface LabModuleProps {
  patients: Patient[];
  onUpdate: (patient: Patient) => void;
  onRecordRevenue: (amount: number, patientId: string) => void;
}

const LabModule: React.FC<LabModuleProps> = ({ patients, onUpdate, onRecordRevenue }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [showPrint, setShowPrint] = useState(false);

  // Diagnostic Analytics
  const stats = useMemo(() => {
    const pending = patients.filter(p => p.status === PatientStatus.IN_LAB).length;
    const totalTests = patients.reduce((acc, p) => acc + p.selectedTests.length, 0);
    return {
      pending,
      totalTests,
      avgProcessing: '45m',
      criticalRatio: '3%'
    };
  }, [patients]);

  const startTest = (p: Patient) => {
    setSelectedPatient(p);
    setResults(p.selectedTests.map(test => ({
      testName: test,
      parameters: [{
        name: 'Primary Parameter',
        value: '',
        min: '',
        max: '',
        unit: '',
        status: 'Normal'
      }],
      overallStatus: 'Normal'
    })));
  };

  const updateParameter = (testIdx: number, paramIdx: number, field: keyof LabParameter, value: string) => {
    const newResults = [...results];
    const param = newResults[testIdx].parameters[paramIdx];
    (param as any)[field] = value;
    
    // Update overall status for test based on parameter statuses
    const anyCritical = newResults[testIdx].parameters.some(p => p.status === 'Critical');
    const anyAbnormal = newResults[testIdx].parameters.some(p => p.status === 'Abnormal');
    
    if (anyCritical) newResults[testIdx].overallStatus = 'Critical';
    else if (anyAbnormal) newResults[testIdx].overallStatus = 'Abnormal';
    else newResults[testIdx].overallStatus = 'Normal';
    
    setResults(newResults);
  };

  const addParameter = (testIdx: number) => {
    const newResults = [...results];
    newResults[testIdx].parameters.push({
      name: '',
      value: '',
      min: '',
      max: '',
      unit: '',
      status: 'Normal'
    });
    setResults(newResults);
  };

  const removeParameter = (testIdx: number, paramIdx: number) => {
    const newResults = [...results];
    if (newResults[testIdx].parameters.length > 1) {
      newResults[testIdx].parameters.splice(paramIdx, 1);
      setResults(newResults);
    }
  };

  const handleSave = () => {
    if (!selectedPatient) return;
    
    const totalFees = results.length * 150;
    onRecordRevenue(totalFees, selectedPatient.id);

    const nextStatus = selectedPatient.selectedXRay.length > 0 ? PatientStatus.IN_XRAY : PatientStatus.IN_PHARMACY;
    
    // Append results instead of replacing
    const updated: Patient = {
      ...selectedPatient,
      labResults: [...(selectedPatient.labResults || []), ...results],
      status: nextStatus
    };
    
    onUpdate(updated);
    alert(`Diagnostic results appended. Revenue of SLE ${totalFees} recorded. Forwarding to next department.`);
    setSelectedPatient(null);
  };

  if (showPrint && selectedPatient) {
    return (
      <div className="bg-white p-12 max-w-4xl mx-auto shadow-2xl border border-slate-200 rounded-sm font-serif">
        <div className="border-b-4 border-slate-800 pb-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Morning Star Hospital</h1>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-0.5">Your Health is our PRIORITY</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Diagnostic Pathology & Laboratory Services</p>
          </div>
          <div className="text-right text-xs text-slate-600 font-medium">
            <p className="font-bold text-slate-800">24 Hours Service Everyday</p>
            <p>Tel: +232 73 929 145, +232 78 355 293</p>
            <p>Freetown, Sierra Leone</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="space-y-1">
            <p><strong>Patient Name:</strong> {selectedPatient.name}</p>
            <p><strong>P-ID:</strong> {selectedPatient.id}</p>
            <p><strong>Age:</strong> {(() => {
              const dob = new Date(selectedPatient.dob);
              const today = new Date();
              let age = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
              return age;
            })()} years</p>
          </div>
          <div className="space-y-1 text-right">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Referred By:</strong> Medical Dept.</p>
            <p><strong>Type:</strong> {selectedPatient.isInPatient ? 'In-Patient' : 'Out-Patient'}</p>
          </div>
        </div>

        <h3 className="text-center font-bold text-lg border-y border-slate-200 py-2 mb-6 uppercase">Laboratory Investigation Report</h3>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="py-2">Test / Parameter</th>
              <th className="py-2">Observed Value</th>
              <th className="py-2 text-center">Reference Range</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <React.Fragment key={i}>
                <tr className="bg-slate-50 border-b border-slate-200">
                   <td colSpan={4} className="py-2 px-2 font-black text-slate-900 uppercase tracking-wider">{r.testName}</td>
                </tr>
                {r.parameters.map((p, j) => (
                   <tr key={`${i}-${j}`} className="border-b border-slate-100 italic">
                      <td className="py-2 pl-6">{p.name || 'Unnamed Parameter'}</td>
                      <td className="py-2">
                        <span className="font-bold">{p.value}</span> {p.unit}
                      </td>
                      <td className="py-2 text-center text-xs text-slate-500">
                        {p.min || p.max ? `${p.min} - ${p.max}` : 'N/A'}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          p.status === 'Critical' ? 'bg-rose-100 text-rose-600' :
                          p.status === 'Abnormal' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                   </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="mt-20 flex justify-between">
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p className="text-xs">Lab Technician</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p className="text-xs">Pathologist Signature</p>
          </div>
        </div>

        <div className="mt-12 no-print flex justify-center space-x-4">
          <button onClick={() => setShowPrint(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg">Back</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Print Report</button>
        </div>
      </div>
    );
  }

  if (selectedPatient) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <i className="fa-solid fa-microscope text-9xl"></i>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black tracking-tight">Process Lab Tests: {selectedPatient.name}</h3>
            <p className="text-slate-400 text-sm mt-1">Pending Investigations: {selectedPatient.selectedTests.join(', ')}</p>
          </div>
          <button onClick={() => setSelectedPatient(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all relative z-10">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-12">
            {results.map((res, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                   <h4 className="font-black text-slate-800 text-sm flex items-center">
                     <span className="w-2 h-2 rounded-full bg-blue-600 mr-3"></span>
                     {res.testName}
                   </h4>
                   <button 
                     onClick={() => addParameter(idx)}
                     className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center"
                   >
                     <i className="fa-solid fa-plus mr-1"></i> Add Parameter
                   </button>
                </div>
                
                <div className="space-y-2">
                  {res.parameters.map((param, pIdx) => (
                    <div key={pIdx} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 xl:grid-cols-12 gap-4 items-end relative group">
                      <div className="xl:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Parameter Name</label>
                        <input 
                          placeholder="e.g. Hemoglobin" 
                          className="w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                          value={param.name} 
                          onChange={(e) => updateParameter(idx, pIdx, 'name', e.target.value)} 
                        />
                      </div>
                      <div className="xl:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Value</label>
                        <input 
                          placeholder="e.g. 14.5" 
                          className="w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                          value={param.value} 
                          onChange={(e) => updateParameter(idx, pIdx, 'value', e.target.value)} 
                        />
                      </div>
                      <div className="xl:col-span-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unit</label>
                        <input 
                          placeholder="g/dL" 
                          className="w-full px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                          value={param.unit} 
                          onChange={(e) => updateParameter(idx, pIdx, 'unit', e.target.value)} 
                        />
                      </div>
                      <div className="xl:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ref. Range (Min - Max)</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            placeholder="Min" 
                            className="w-1/2 px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-center" 
                            value={param.min} 
                            onChange={(e) => updateParameter(idx, pIdx, 'min', e.target.value)} 
                          />
                          <span className="text-slate-300">-</span>
                          <input 
                            placeholder="Max" 
                            className="w-1/2 px-4 py-3 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-center" 
                            value={param.max} 
                            onChange={(e) => updateParameter(idx, pIdx, 'max', e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="xl:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Interpretation</label>
                        <div className="grid grid-cols-3 gap-1">
                          {['Normal', 'Abnormal', 'Critical'].map((s) => (
                            <button 
                              key={s}
                              onClick={() => updateParameter(idx, pIdx, 'status', s)}
                              className={`py-3 text-[10px] font-black uppercase rounded-xl border transition-all ${
                                param.status === s 
                                  ? s === 'Critical' ? 'bg-rose-500 text-white border-rose-600' :
                                    s === 'Abnormal' ? 'bg-amber-500 text-white border-amber-600' :
                                    'bg-emerald-500 text-white border-emerald-600'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {res.parameters.length > 1 && (
                        <button 
                          onClick={() => removeParameter(idx, pIdx)}
                          className="absolute -top-3 -right-3 w-7 h-7 bg-rose-50 text-rose-500 border border-rose-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                        >
                          <i className="fa-solid fa-minus text-xs"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end space-x-6">
            <button onClick={() => setShowPrint(true)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Print Preview</button>
            <button onClick={handleSave} className="px-12 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95">Save & Forward Record</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Module Analytics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i className="fa-solid fa-microscope text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Work</p>
            <h4 className="text-xl font-black text-slate-900">{stats.pending} Cases</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i className="fa-solid fa-flask-vial text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Studies</p>
            <h4 className="text-xl font-black text-slate-900">{stats.totalTests} Tests</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
            <h4 className="text-xl font-black text-slate-900">{stats.avgProcessing}</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="fa-solid fa-biohazard text-xl"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Ratio</p>
            <h4 className="text-xl font-black text-rose-600">{stats.criticalRatio}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
           <i className="fa-solid fa-list-check mr-3 text-indigo-500"></i> Pending Lab Tests
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="py-4 px-4">P-ID</th>
                <th className="py-4 px-4">Patient</th>
                <th className="py-4 px-4">Tests Ordered</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-4 font-mono text-xs text-blue-600 group-hover:text-indigo-600 transition-colors">{p.id}</td>
                  <td className="py-5 px-4 font-bold text-slate-800">{p.name}</td>
                  <td className="py-5 px-4 text-slate-500 font-medium">{p.selectedTests.join(', ')}</td>
                  <td className="py-5 px-4 text-right">
                    <button onClick={() => startTest(p)} className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-indigo-200">Process Entry</button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                     <div className="flex flex-col items-center opacity-30">
                        <i className="fa-solid fa-flask-vial text-5xl mb-4"></i>
                        <p className="italic font-medium">All investigations are currently up to date.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LabModule;
