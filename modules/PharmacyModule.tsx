
import React, { useState, useMemo } from 'react';
import { Patient, PatientStatus, PharmacySale } from '../types';

interface PharmacyModuleProps {
  patients: Patient[];
  onUpdate: (patient: Patient) => void;
  onRecordSale: (amount: number, patientId: string) => void;
}

const PharmacyModule: React.FC<PharmacyModuleProps> = ({ patients, onUpdate, onRecordSale }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sales, setSales] = useState<PharmacySale[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [finalizedData, setFinalizedData] = useState<{ patient: Patient; sales: PharmacySale[]; total: number } | null>(null);

  const stats = useMemo(() => {
    const awaiting = patients.filter(p => p.status === PatientStatus.IN_PHARMACY).length;
    const completed = patients.filter(p => p.status === PatientStatus.COMPLETED).length;
    return {
      awaiting,
      completed,
      lowStock: '12 Items',
      fillRate: '98%'
    };
  }, [patients]);

  const addToSales = (med: string) => {
    const price = 50 + Math.round(Math.random() * 200);
    setSales([...sales, {
      item: med,
      type: 'Medicine',
      quantity: 1,
      price: price,
      total: price
    }]);
  };

  const removeFromSales = (index: number) => {
    const newSales = [...sales];
    newSales.splice(index, 1);
    setSales(newSales);
  };

  const handleComplete = () => {
    if (!selectedPatient) return;
    const totalSaleAmount = sales.reduce((acc, curr) => acc + curr.total, 0);
    const grandTotal = totalSaleAmount + selectedPatient.consultationFee;
    
    // 1. Record the sale in the financial ledger
    onRecordSale(totalSaleAmount, selectedPatient.id);

    const updated: Patient = {
      ...selectedPatient,
      pharmacySales: sales,
      status: PatientStatus.COMPLETED
    };

    // 2. Prepare data for the printing receipt
    setFinalizedData({
      patient: updated,
      sales: sales,
      total: grandTotal
    });

    // 3. Update the global state
    onUpdate(updated);
    
    // 4. Show the receipt
    setShowReceipt(true);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setSelectedPatient(null);
    setSales([]);
    setFinalizedData(null);
  };

  if (showReceipt && finalizedData) {
    const { patient, sales, total } = finalizedData;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md no-print" onClick={closeReceipt}></div>
        <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 custom-scrollbar print:max-h-none print:rounded-none print:shadow-none print:p-0">
          <div className="p-12 print:p-8">
            <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-2xl font-black text-2xl shadow-xl">MSH</div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">Morning Star Hospital</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Official Medical Receipt</p>
                    <span className="text-[9px] text-slate-400">•</span>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Your Health is our PRIORITY</p>
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold mt-1">
                    Tel: +232 73 929 145, +232 78 355 293 • 24 Hours Service Everyday
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Number</p>
                <p className="text-xl font-black font-mono">INV-{Math.floor(100000 + Math.random() * 900000)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-10">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                  <p className="text-lg font-black text-slate-900">{patient.name}</p>
                </div>
                <div className="text-xs font-bold text-slate-700">PID: {patient.id}</div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 mb-10">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <th className="pb-4">Description</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="group">
                    <td className="py-4 font-bold text-slate-800 text-sm">Consultation Fee ({patient.clinic})</td>
                    <td className="py-4 text-center text-sm font-bold">1</td>
                    <td className="py-4 text-right font-black text-slate-900">SLE {patient.consultationFee.toLocaleString()}</td>
                  </tr>
                  {sales.map((item, i) => (
                    <tr key={i} className="group">
                      <td className="py-4 font-bold text-slate-800 text-sm">{item.item}</td>
                      <td className="py-4 text-center text-sm font-bold">{item.quantity}</td>
                      <td className="py-4 text-right font-black text-slate-900">SLE {item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end space-y-2">
               <div className="flex justify-between w-64 items-end">
                  <span className="text-xs font-black uppercase text-slate-400">Grand Total:</span>
                  <span className="text-3xl font-black text-blue-600">SLE {total.toLocaleString()}</span>
               </div>
            </div>

            <div className="mt-12 no-print flex justify-center space-x-6">
              <button onClick={closeReceipt} className="px-10 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl transition-all hover:bg-slate-200 uppercase text-[10px] tracking-widest">Close</button>
              <button onClick={() => window.print()} className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-105 uppercase text-[10px] tracking-widest">
                <i className="fa-solid fa-print mr-2"></i> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPatient) {
    const totalMeds = sales.reduce((acc, curr) => acc + curr.total, 0);
    const grandTotal = totalMeds + selectedPatient.consultationFee;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-900 p-8 text-white flex justify-between items-center relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <i className="fa-solid fa-cash-register text-9xl"></i>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight">Point of Sale: {selectedPatient.name}</h3>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mt-1">{selectedPatient.id}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all relative z-10">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-10">
              <div className="flex items-center space-x-3 mb-8">
                 <i className="fa-solid fa-prescription text-emerald-600 text-sm"></i>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Orders</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPatient.selectedMedicine.map((med, i) => (
                  <div key={i} className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex justify-between items-center">
                    <span className="font-black text-emerald-900 text-sm">{med}</span>
                    <button onClick={() => addToSales(med)} className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                      <i className="fa-solid fa-cart-plus text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-lg p-10 border border-slate-100">
            <div className="space-y-4">
              {sales.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => removeFromSales(idx)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                    <span className="font-black text-slate-800 text-sm">{item.item}</span>
                  </div>
                  <div className="font-black text-blue-600 text-sm">SLE {item.total.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-10">Checkout</h4>
            <div className="space-y-5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold text-xs">Pharma Items</span>
                <span className="font-black">SLE {totalMeds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold text-xs">Consultation</span>
                <span className="font-black">SLE {selectedPatient.consultationFee.toLocaleString()}</span>
              </div>
              <div className="h-[1px] bg-slate-800 my-4"></div>
              <div className="flex items-end justify-between">
                <h5 className="text-4xl font-black text-white">SLE {grandTotal.toLocaleString()}</h5>
                <i className="fa-solid fa-file-invoice text-blue-500 text-2xl mb-1"></i>
              </div>
            </div>
            <button 
              onClick={handleComplete} 
              className="w-full mt-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              FINALIZE SALE & PRINT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i className="fa-solid fa-receipt text-xl"></i></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p><h4 className="text-xl font-black text-slate-900">{stats.awaiting}</h4></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fa-solid fa-clipboard-check text-xl"></i></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p><h4 className="text-xl font-black text-slate-900">{stats.completed}</h4></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.filter(p => p.status !== PatientStatus.COMPLETED).map(p => (
          <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:shadow-2xl transition-all group">
            <h4 className="font-black text-slate-900 text-xl mb-1 tracking-tight">{p.name}</h4>
            <p className="text-xs text-slate-500 mb-8 font-medium">{p.id} • {p.clinic}</p>
            <button onClick={() => setSelectedPatient(p)} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest">Process Sale</button>
          </div>
        ))}
        {patients.filter(p => p.status !== PatientStatus.COMPLETED).length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">No prescriptions pending.</div>
        )}
      </div>
    </div>
  );
};

export default PharmacyModule;
