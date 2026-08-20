
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface FinanceModuleProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
}

type SortKey = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, onAddTransaction }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeType, setActiveType] = useState<TransactionType>('INCOME');
  
  // Filtering & Sorting State
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'date', 
    direction: 'desc' 
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'CONSULTATION' as Transaction['category'],
    amount: '',
    description: '',
    manualReference: ''
  });

  // Categories lists
  const incomeCategories: Transaction['category'][] = ['CONSULTATION', 'PHARMACY', 'LAB', 'RADIOLOGY', 'OTHER'];
  const expenditureCategories: Transaction['category'][] = ['SALARY', 'SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'OTHER'];
  const allCategories = Array.from(new Set([...incomeCategories, ...expenditureCategories]));

  const currentCategories = activeType === 'INCOME' ? incomeCategories : expenditureCategories;

  // Filtered and Sorted Data
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply Type Filter
    if (filterType !== 'ALL') {
      result = result.filter(t => t.type === filterType);
    }

    // Apply Category Filter
    if (filterCategory !== 'ALL') {
      result = result.filter(t => t.category === filterCategory);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) || 
        (t.referenceId && t.referenceId.toLowerCase().includes(query)) ||
        t.id.toLowerCase().includes(query)
      );
    }

    // Apply Sorting
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactions, filterType, filterCategory, searchQuery, sortConfig]);

  // Financial Analytics (on all data or filtered? usually all for dashboard)
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenditure = transactions.filter(t => t.type === 'EXPENDITURE').reduce((acc, t) => acc + t.amount, 0);
    const net = totalIncome - totalExpenditure;
    const margin = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;
    
    return {
      totalIncome,
      totalExpenditure,
      net,
      margin,
      taxLiability: Math.round(net > 0 ? net * 0.15 : 0)
    };
  }, [transactions]);

  const toggleType = (type: TransactionType) => {
    setActiveType(type);
    setFormData(prev => ({
      ...prev,
      category: type === 'INCOME' ? 'CONSULTATION' : 'SALARY'
    }));
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = Number(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    const newTx: Transaction = {
      id: `TX-MAN-${Date.now()}`,
      date: formData.date,
      type: activeType,
      category: formData.category,
      amount: amountNum,
      description: formData.description.trim(),
      referenceId: formData.manualReference.trim() || 'MANUAL-ENTRY'
    };
    
    onAddTransaction(newTx);
    setShowAddForm(false);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      category: 'CONSULTATION', 
      amount: '', 
      description: '',
      manualReference: ''
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h3>
          <p className="text-slate-500 text-sm font-medium">Real-time Income & Expenditure auditing</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all flex items-center group"
        >
          <i className="fa-solid fa-plus-circle mr-3 text-white/80 group-hover:rotate-90 transition-transform"></i> New Manual Entry
        </button>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Growth Rate', value: '+12.4%', icon: 'fa-chart-line', bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Profit Margin', value: `${stats.margin}%`, icon: 'fa-percent', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Est. Tax (15%)', value: `SLE ${stats.taxLiability.toLocaleString()}`, icon: 'fa-file-invoice-dollar', bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Burn Forecast', value: 'Steady', icon: 'fa-fire', bg: 'bg-rose-50', color: 'text-rose-600' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center space-x-5">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
              <i className={`fa-solid ${item.icon} text-xl`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <h4 className="text-xl font-black text-slate-900">{item.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700"><i className="fa-solid fa-arrow-trend-up text-9xl"></i></div>
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Cumulative Income</p>
          <h4 className="text-3xl font-black">SLE {stats.totalIncome.toLocaleString()}</h4>
        </div>
        <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700"><i className="fa-solid fa-arrow-trend-down text-9xl"></i></div>
          <p className="text-rose-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Cumulative Expenses</p>
          <h4 className="text-3xl font-black">SLE {stats.totalExpenditure.toLocaleString()}</h4>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Cash Position</p>
          <h4 className={`text-3xl font-black ${stats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>SLE {stats.net.toLocaleString()}</h4>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
          <input 
            type="text" 
            placeholder="Search by description or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-300 font-medium text-sm transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'INCOME', 'EXPENDITURE'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-lg font-black text-slate-900">Transaction History</h4>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredAndSortedTransactions.length} entries</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="p-8 cursor-pointer group" onClick={() => handleSort('date')}>
                  <div className="flex items-center space-x-2">
                    <span>Date</span>
                    <i className={`fa-solid fa-sort ${sortConfig.key === 'date' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                  </div>
                </th>
                <th className="p-8 cursor-pointer group" onClick={() => handleSort('category')}>
                   <div className="flex items-center space-x-2">
                    <span>Category</span>
                    <i className={`fa-solid fa-sort ${sortConfig.key === 'category' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                  </div>
                </th>
                <th className="p-8">Description</th>
                <th className="p-8">Reference ID</th>
                <th className="p-8 text-right cursor-pointer group" onClick={() => handleSort('amount')}>
                   <div className="flex items-center justify-end space-x-2">
                    <span>Amount</span>
                    <i className={`fa-solid fa-sort ${sortConfig.key === 'amount' ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}></i>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-8">
                    <div className="font-bold text-slate-800 text-sm">{tx.date}</div>
                    <div className="text-[10px] text-slate-400 font-mono group-hover:text-blue-500 transition-colors">{tx.id}</div>
                  </td>
                  <td className="p-8">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="p-8 text-xs font-medium text-slate-600 max-w-xs leading-relaxed">{tx.description}</td>
                  <td className="p-8">
                    <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{tx.referenceId || 'N/A'}</div>
                  </td>
                  <td className={`p-8 text-right font-black text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} SLE {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredAndSortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                        <i className="fa-solid fa-filter-circle-xmark text-4xl"></i>
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No transactions match your filters</p>
                      <button 
                        onClick={() => { setFilterType('ALL'); setFilterCategory('ALL'); setSearchQuery(''); }}
                        className="mt-4 text-blue-600 font-bold text-xs hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <i className="fa-solid fa-cash-register text-9xl"></i>
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Manual Entry Record</h3>
                  <p className="text-slate-400 text-sm mt-2 font-medium">Capture out-of-system clinical or operational transactions.</p>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                <button 
                  type="button"
                  onClick={() => toggleType('INCOME')}
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center ${activeType === 'INCOME' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className={`fa-solid fa-plus-circle mr-3 ${activeType === 'INCOME' ? 'animate-bounce' : ''}`}></i> Income Entry
                </button>
                <button 
                  type="button"
                  onClick={() => toggleType('EXPENDITURE')}
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center ${activeType === 'EXPENDITURE' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className={`fa-solid fa-minus-circle mr-3 ${activeType === 'EXPENDITURE' ? 'animate-bounce' : ''}`}></i> Outflow Entry
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Date</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Group</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Transaction['category']})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-sm text-slate-700 cursor-pointer appearance-none"
                  >
                    {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payable Amount (SLE)</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-blue-600 transition-colors">SLE</span>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-2xl text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference ID / Invoice #</label>
                  <input 
                    type="text" 
                    placeholder="e.g. INV-8821, CLM-002"
                    value={formData.manualReference}
                    onChange={e => setFormData({...formData, manualReference: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ledger Memo</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-medium text-sm h-32 resize-none text-slate-700"
                    placeholder="Provide clear details for financial auditing purposes..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 transition-colors border border-transparent hover:border-slate-100 rounded-2xl"
                >
                  Discard Record
                </button>
                <button 
                  type="submit"
                  className={`px-12 py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${activeType === 'INCOME' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'}`}
                >
                  Finalize {activeType === 'INCOME' ? 'Income' : 'Expenditure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
