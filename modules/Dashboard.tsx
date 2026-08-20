
import React, { useMemo } from 'react';
import { Patient, StoreOrder, Employee, ViewType, PatientStatus, Transaction, Appointment } from '../types.ts';

interface DashboardProps {
  patients: Patient[];
  orders: StoreOrder[];
  employees: Employee[];
  transactions: Transaction[];
  onViewChange: (view: ViewType) => void;
}

const CLINIC_ICONS: Record<string, string> = {
  'Urology & Andrology': 'fa-kidney',
  'General Surgery': 'fa-scalpel',
  'Orthopedics': 'fa-bone',
  'Gynecology': 'fa-venus',
  'Obstetrics & Infertility': 'fa-baby',
  'GIT, Liver & Endoscopy': 'fa-stomach',
  'Cardiology': 'fa-heart-pulse',
  'Internal Medicine': 'fa-lungs',
  'Pediatrics': 'fa-children',
  'Family Medicine': 'fa-house-user'
};

export default function Dashboard({ patients, orders, employees, transactions, onViewChange }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenditure = transactions
    .filter(t => t.type === 'EXPENDITURE')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpenditure;

  const upcomingFollowUps = useMemo(() => {
    const list: { patient: string; appt: Appointment; pid: string }[] = [];
    patients.forEach(p => {
      p.appointments.forEach(a => {
        if (a.date >= today) {
          list.push({ patient: p.name, appt: a, pid: p.id });
        }
      });
    });
    return list.sort((a, b) => a.appt.date.localeCompare(b.appt.date)).slice(0, 5);
  }, [patients, today]);

  // Calculate Revenue per Clinic
  const clinicRevenueMetrics = useMemo(() => {
    const revenueMap: Record<string, { total: number; count: number }> = {};
    
    Object.keys(CLINIC_ICONS).forEach(clinic => {
      revenueMap[clinic] = { total: 0, count: 0 };
    });

    transactions
      .filter(t => t.category === 'CONSULTATION')
      .forEach(t => {
        const patient = patients.find(p => p.id === t.referenceId);
        if (patient && revenueMap[patient.clinic]) {
          revenueMap[patient.clinic].total += t.amount;
          revenueMap[patient.clinic].count += 1;
        }
      });

    const totalConsultationRevenue = Object.values(revenueMap).reduce((acc, curr) => acc + curr.total, 0);

    return {
      breakdown: Object.entries(revenueMap).sort((a, b) => b[1].total - a[1].total),
      totalConsultationRevenue
    };
  }, [transactions, patients]);

  const quickActions = [
    { id: 'REGISTRATION', label: 'Add Patient', icon: 'fa-user-plus', color: 'bg-blue-600' },
    { id: 'FINANCE', label: 'Financial Ledger', icon: 'fa-calculator', color: 'bg-amber-600' },
    { id: 'PHARMACY', label: 'Point of Sale', icon: 'fa-cash-register', color: 'bg-emerald-600' },
    { id: 'STORE', label: 'Stock Entry', icon: 'fa-boxes-stacked', color: 'bg-slate-700' },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <i className="fa-solid fa-heart-pulse"></i>
              <span>Your Health is our PRIORITY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white">Morning Star Hospital Terminal</h2>
            <p className="text-slate-400 text-xs mb-3 font-semibold tracking-wider">
              24 Hours Service Everyday • Tel: +232 73 929 145, +232 78 355 293
            </p>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Hospital performance is <span className="text-emerald-400 font-bold">Optimal</span>. 
              Today's cash liquidity: <span className="text-white font-bold text-lg ml-2">SLE {netBalance.toLocaleString()}</span>.
            </p>
          </div>
          <div className="flex items-center space-x-3">
             {quickActions.map(action => (
               <button 
                 key={action.id}
                 onClick={() => onViewChange(action.id)}
                 className={`${action.color} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 text-white group`}
                 title={action.label}
               >
                 <i className={`fa-solid ${action.icon} text-lg md:text-xl group-hover:rotate-12 transition-transform`}></i>
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Stats Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700"><i className="fa-solid fa-vault text-8xl"></i></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Net Position</p>
                <h3 className={`text-4xl font-black tracking-tighter ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>SLE {netBalance.toLocaleString()}</h3>
                <div className="mt-8 flex items-center space-x-3 border-t border-slate-50 pt-6">
                   <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Inflow</p>
                      <p className="text-sm font-black text-emerald-600">+{totalIncome.toLocaleString()}</p>
                   </div>
                   <div className="flex-1 text-right">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Outflow</p>
                      <p className="text-sm font-black text-rose-600">-{totalExpenditure.toLocaleString()}</p>
                   </div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700"><i className="fa-solid fa-users text-8xl"></i></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registrations</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{patients.length}</h3>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Growth Logged</span>
                   <span className="w-10 h-6 bg-blue-50 text-blue-600 text-[10px] font-black flex items-center justify-center rounded-lg">+12%</span>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Clinical Revenue Distribution</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cash flow per specialty clinic</p>
              </div>
              <div className="px-6 py-3 bg-blue-50 rounded-2xl border border-blue-100">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Total: SLE {clinicRevenueMetrics.totalConsultationRevenue.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {clinicRevenueMetrics.breakdown.map(([clinic, data]) => {
                const percentage = clinicRevenueMetrics.totalConsultationRevenue > 0 
                  ? (data.total / clinicRevenueMetrics.totalConsultationRevenue) * 100 
                  : 0;
                
                return (
                  <div key={clinic} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <i className={`fa-solid ${CLINIC_ICONS[clinic]} text-sm`}></i>
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{clinic}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-slate-900">SLE {data.total.toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">{data.count} Visits</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 group-hover:bg-blue-600" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reminders Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fa-solid fa-bell-concierge text-7xl"></i>
             </div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Upcoming Follow-ups</h4>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                   <i className="fa-solid fa-calendar-day text-xs"></i>
                </div>
             </div>
             
             <div className="space-y-4 relative z-10">
                {upcomingFollowUps.map((item, idx) => (
                   <div key={idx} className={`p-5 rounded-3xl border transition-all cursor-default ${item.appt.date === today ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/20' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                      <div className="flex justify-between items-start mb-3">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${item.appt.date === today ? 'text-white' : 'text-blue-400'}`}>
                            {item.appt.date === today ? 'DUE TODAY' : item.appt.date}
                         </p>
                         <span className="text-[9px] font-bold opacity-60 font-mono">{item.pid}</span>
                      </div>
                      <h5 className="font-black text-sm mb-1">{item.patient}</h5>
                      <p className={`text-[11px] font-medium leading-relaxed ${item.appt.date === today ? 'text-blue-50' : 'text-slate-400'}`}>
                         {item.appt.reason} @ {item.appt.time}
                      </p>
                   </div>
                ))}
                {upcomingFollowUps.length === 0 && (
                   <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                      <i className="fa-solid fa-calendar-xmark text-3xl text-slate-700 mb-4"></i>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No clinical follow-ups logged</p>
                   </div>
                )}
             </div>
             
             <button 
               onClick={() => onViewChange('CLINIC')}
               className="w-full mt-10 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
             >
                View Full Clinical Schedule
             </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
             <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center">
                <i className="fa-solid fa-chart-pie mr-3 text-slate-300"></i> Revenue Split
             </h4>
             <div className="space-y-6">
                {['CONSULTATION', 'PHARMACY', 'LAB', 'RADIOLOGY'].map((cat) => {
                  const catTotal = transactions.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0);
                  const percentage = totalIncome > 0 ? (catTotal / totalIncome) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-slate-400">{cat}</span>
                        <span className="text-slate-900">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                        <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
