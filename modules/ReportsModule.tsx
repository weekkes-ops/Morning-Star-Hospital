
import React, { useState, useMemo } from 'react';
import { Transaction, Patient, PatientStatus, TransactionType } from '../types';

interface ReportsModuleProps {
  transactions: Transaction[];
  patients: Patient[];
}

type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

const ReportsModule: React.FC<ReportsModuleProps> = ({ transactions, patients }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Filtering State
  const [timeframe, setTimeframe] = useState<Timeframe>('DAILY');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const incomeCategories = ['CONSULTATION', 'PHARMACY', 'LAB', 'RADIOLOGY', 'OTHER'];
  const expenseCategories = ['SALARY', 'SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'OTHER'];
  
  const currentCategoryList = useMemo(() => {
    if (typeFilter === 'INCOME') return incomeCategories;
    if (typeFilter === 'EXPENDITURE') return expenseCategories;
    return Array.from(new Set([...incomeCategories, ...expenseCategories]));
  }, [typeFilter]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let effectiveStart = startDate;
    let effectiveEnd = endDate;

    if (timeframe === 'DAILY') {
      effectiveStart = todayStr;
      effectiveEnd = todayStr;
    } else if (timeframe === 'WEEKLY') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      effectiveStart = lastWeek.toISOString().split('T')[0];
      effectiveEnd = todayStr;
    } else if (timeframe === 'MONTHLY') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      effectiveStart = startOfMonth.toISOString().split('T')[0];
      effectiveEnd = todayStr;
    }

    const isInTimeframe = (dateStr: string) => dateStr >= effectiveStart && dateStr <= effectiveEnd;

    // 1. Filter Transactions based on time, type, and category
    const filteredTx = transactions.filter(t => {
      const timeMatch = isInTimeframe(t.date);
      const typeMatch = typeFilter === 'ALL' || t.type === typeFilter;
      const catMatch = categoryFilter === 'ALL' || t.category === categoryFilter;
      return timeMatch && typeMatch && catMatch;
    });

    // 2. Filter Patients based on time and status
    const filteredPts = patients.filter(p => {
      const timeMatch = isInTimeframe(p.date);
      const statusMatch = statusFilter === 'ALL' || p.status === statusFilter;
      return timeMatch && statusMatch;
    });

    const totalIncome = transactions.filter(t => isInTimeframe(t.date) && t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenditure = transactions.filter(t => isInTimeframe(t.date) && t.type === 'EXPENDITURE').reduce((acc, t) => acc + t.amount, 0);
    
    // Revenue by category (respecting current filters)
    const catRevenue = currentCategoryList.reduce((acc, cat) => {
      acc[cat] = filteredTx.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      transactions: filteredTx,
      patients: filteredPts,
      totalIncome,
      totalExpenditure,
      netProfit: totalIncome - totalExpenditure,
      catRevenue,
      effectiveStart,
      effectiveEnd,
      displayRevenue: filteredTx.reduce((acc, t) => acc + t.amount, 0)
    };
  }, [transactions, patients, timeframe, startDate, endDate, statusFilter, typeFilter, categoryFilter, todayStr, currentCategoryList]);

  const resetFilters = () => {
    setTimeframe('DAILY');
    setStartDate(todayStr);
    setEndDate(todayStr);
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
  };

  const exportToCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransactions = () => {
    const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Description'];
    const rows = filteredData.transactions.map(t => [
      t.id,
      t.date,
      t.amount.toString(),
      t.type,
      t.category,
      t.description
    ]);
    exportToCSV(headers, rows, 'Financial_Report');
  };

  const handleExportPatients = () => {
    const headers = ['ID', 'Name', 'Registration Date', 'Mobile', 'DOB', 'Clinic', 'Status', 'Condition', 'In-Patient'];
    const rows = filteredData.patients.map(p => [
      p.id,
      p.name,
      p.date,
      p.mobile,
      p.dob,
      p.clinic,
      p.status,
      p.condition || '',
      p.isInPatient ? 'YES' : 'NO'
    ]);
    exportToCSV(headers, rows, 'Patient_Report');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      {/* Advanced Filter Control Center */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200/50 p-10 overflow-hidden no-print">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Report Configuration</h3>
            <p className="text-slate-500 text-sm font-medium">Fine-tune medical and financial data views.</p>
          </div>
          <button onClick={resetFilters} className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center">
            <i className="fa-solid fa-rotate-left mr-2"></i> Reset Parameters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Timeframe Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period Preset</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as const).map(tf => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-tighter transition-all ${timeframe === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection (Custom) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
            <div className="flex items-center space-x-2">
              <input 
                type="date" 
                value={timeframe === 'CUSTOM' ? startDate : filteredData.effectiveStart}
                readOnly={timeframe !== 'CUSTOM'}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${timeframe === 'CUSTOM' ? 'bg-white border-blue-200 focus:ring-4 focus:ring-blue-500/5' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
              />
              <span className="text-slate-300 font-black text-[10px]">TO</span>
              <input 
                type="date" 
                value={timeframe === 'CUSTOM' ? endDate : filteredData.effectiveEnd}
                readOnly={timeframe !== 'CUSTOM'}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${timeframe === 'CUSTOM' ? 'bg-white border-blue-200 focus:ring-4 focus:ring-blue-500/5' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
              />
            </div>
          </div>

          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Finance Flow</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {(['ALL', 'INCOME', 'EXPENDITURE'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => { setTypeFilter(type); setCategoryFilter('ALL'); }}
                  className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-tighter transition-all ${typeFilter === type ? (type === 'INCOME' ? 'bg-emerald-500 text-white' : type === 'EXPENDITURE' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white') : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Status Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none hover:bg-white transition-colors"
              >
                <option value="ALL">All Categories</option>
                {currentCategoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PatientStatus | 'ALL')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none hover:bg-white transition-colors"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(PatientStatus).map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 px-10">
        <i className="fa-solid fa-calendar-check text-blue-500 text-xs"></i>
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Reporting Active: {filteredData.effectiveStart} — {filteredData.effectiveEnd}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-4"></span>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative group hover:scale-[1.02] transition-all">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><i className="fa-solid fa-chart-line text-9xl"></i></div>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Display Value</p>
           <h4 className="text-4xl font-black tracking-tighter">SLE {filteredData.displayRevenue.toLocaleString()}</h4>
           <div className="mt-6 flex items-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/10 pt-4">
             <i className="fa-solid fa-list-ol"></i>
             <span>{filteredData.transactions.length} Transactions</span>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative group hover:border-blue-500 transition-all">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Throughput</p>
           <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{filteredData.patients.length} Count</h4>
           <div className="mt-6 flex items-center space-x-3 text-[10px] font-bold text-blue-600 uppercase tracking-widest border-t border-slate-50 pt-4">
             <i className="fa-solid fa-user-tag"></i>
             <span>Filter: {statusFilter}</span>
           </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative group">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inflows vs Outflows</p>
           <div className="space-y-1">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600">IN:</span>
                <span className="text-lg font-black text-slate-800">SLE {filteredData.totalIncome.toLocaleString()}</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600">OUT:</span>
                <span className="text-lg font-black text-slate-800">SLE {filteredData.totalExpenditure.toLocaleString()}</span>
             </div>
           </div>
           <div className="mt-6 border-t border-slate-50 pt-4 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">Margin</span>
              <span className={`text-[10px] font-black uppercase ${filteredData.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{filteredData.totalIncome > 0 ? (filteredData.netProfit / filteredData.totalIncome * 100).toFixed(1) : 0}%</span>
           </div>
        </div>
        <div className={`p-10 rounded-[3rem] text-white shadow-2xl transition-colors duration-500 ${filteredData.netProfit >= 0 ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
           <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">Performance Result</p>
           <h4 className="text-4xl font-black tracking-tighter">SLE {filteredData.netProfit.toLocaleString()}</h4>
           <div className="mt-6 flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest border-t border-white/20 pt-4">
              <i className={`fa-solid ${filteredData.netProfit >= 0 ? 'fa-arrow-up-right-dots' : 'fa-arrow-down-right-dots'}`}></i>
              <span>{filteredData.netProfit >= 0 ? 'Surplus Logged' : 'Deficit Logged'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Category Contribution Chart (Dynamic) */}
        <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Category Contribution</h4>
              <i className="fa-solid fa-chart-bar text-slate-200 text-2xl"></i>
           </div>
           <div className="space-y-8">
              {Object.entries(filteredData.catRevenue).map(([cat, amt]) => {
                const total = filteredData.displayRevenue || 1;
                const percentage = (amt as number / total) * 100;
                if (amt === 0 && typeFilter === 'ALL') return null; // Hide zeros in "ALL" view to reduce noise
                return (
                  <div key={cat} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                       <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${typeFilter === 'EXPENDITURE' ? 'bg-rose-500' : 'bg-blue-600'}`}></div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{cat}</p>
                       </div>
                       <p className="text-sm font-black text-slate-900">SLE {(amt as number).toLocaleString()}</p>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                      <div className={`h-full rounded-full transition-all duration-1000 ${typeFilter === 'EXPENDITURE' ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="flex justify-end">
                       <span className="text-[9px] font-black text-slate-400">{percentage.toFixed(1)}% of selection</span>
                    </div>
                  </div>
                );
              })}
              {Object.values(filteredData.catRevenue).every(v => v === 0) && (
                <div className="py-20 text-center opacity-30 italic font-medium">No revenue data for selected filters.</div>
              )}
           </div>
        </div>

        {/* Dynamic Ledger List */}
        <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Report Ledger Entry</h4>
              <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={handleExportTransactions} 
                   className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/10 active:scale-95 transition-all flex items-center"
                   title="Export currently filtered financial transactions"
                 >
                    <i className="fa-solid fa-file-csv mr-2 text-sm"></i> CSV: Ledger
                 </button>
                 <button 
                   onClick={handleExportPatients} 
                   className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all flex items-center"
                   title="Export currently filtered patients"
                 >
                    <i className="fa-solid fa-file-csv mr-2 text-sm"></i> CSV: Patients
                 </button>
                 <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                    <i className="fa-solid fa-print mr-2"></i> Print Report
                 </button>
              </div>
           </div>
           <div className="overflow-y-auto max-h-[500px] custom-scrollbar pr-4">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                       <th className="pb-5">Date / Identity</th>
                       <th className="pb-5">Category</th>
                       <th className="pb-5 text-right">Amount</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredData.transactions.slice().reverse().map(t => (
                      <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-5">
                           <p className="text-xs font-black text-slate-800">{t.date}</p>
                           <p className="text-[10px] font-mono text-slate-400 uppercase">{t.id}</p>
                        </td>
                        <td className="py-5">
                           <div className="flex flex-col">
                             <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase w-fit tracking-tighter mb-1">{t.category}</span>
                             <p className="text-[9px] text-slate-400 font-medium max-w-[150px] truncate">{t.description}</p>
                           </div>
                        </td>
                        <td className={`py-5 text-right font-black text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === 'INCOME' ? '+' : '-'} {t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {filteredData.transactions.length === 0 && (
                      <tr><td colSpan={3} className="py-32 text-center text-slate-300 italic text-sm">No transaction records found matching the current filter criteria.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
           <div className="mt-10 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
              <span>Verified Report Footer</span>
              <span>Total Transactions: {filteredData.transactions.length}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
