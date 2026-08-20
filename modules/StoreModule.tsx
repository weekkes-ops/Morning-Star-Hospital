
import React, { useState } from 'react';
import { StoreOrder } from '../types';

interface StoreModuleProps {
  orders: StoreOrder[];
  onAddOrder: (order: StoreOrder) => void;
}

const StoreModule: React.FC<StoreModuleProps> = ({ orders, onAddOrder }) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'INCOMING' | 'OUTGOING'>('LIST');
  const [formData, setFormData] = useState({
    poNumber: '',
    item: '',
    specification: '',
    unit: 'Pieces',
    quantity: 0,
    unitPrice: 0,
    staffName: '',
    staffDepartment: ''
  });

  const calculatedTotal = formData.quantity * formData.unitPrice;

  const handleSubmit = (type: 'INCOMING' | 'OUTGOING') => {
    const order: StoreOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...formData,
      total: type === 'INCOMING' ? calculatedTotal : 0,
      type
    };
    onAddOrder(order);
    alert(`${type} record saved successfully.`);
    setActiveTab('LIST');
    setFormData({ poNumber: '', item: '', specification: '', unit: 'Pieces', quantity: 0, unitPrice: 0, staffName: '', staffDepartment: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        {(['LIST', 'INCOMING', 'OUTGOING'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
              activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab === 'LIST' ? 'Stock History' : tab === 'INCOMING' ? '+ Incoming (PO)' : '- Outgoing (Issuance)'}
          </button>
        ))}
      </div>

      {activeTab === 'LIST' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="p-6">Date</th>
                <th className="p-6">Type</th>
                <th className="p-6">PO / Staff</th>
                <th className="p-6">Item Description</th>
                <th className="p-6 text-center">Qty</th>
                <th className="p-6 text-right">Total (SLE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice().reverse().map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 text-sm text-slate-500">{order.date}</td>
                  <td className="p-6">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      order.type === 'INCOMING' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="p-6 font-mono text-xs">
                    {order.type === 'INCOMING' ? (
                      <span className="text-slate-600">PO: {order.poNumber || '-'}</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold text-rose-600">{order.staffName || 'Unknown Staff'}</span>
                        <span className="text-[10px] text-slate-400">{order.staffDepartment || 'No Dept'}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-slate-800">{order.item}</div>
                    <div className="text-[10px] text-slate-400">{order.specification}</div>
                  </td>
                  <td className="p-6 text-center text-sm">{order.quantity} {order.unit}</td>
                  <td className="p-6 text-right font-bold text-slate-700">
                    {order.type === 'INCOMING' && order.total ? `SLE ${order.total.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <i className="fa-solid fa-boxes-stacked text-5xl mb-4"></i>
                      <p className="italic">No store movements recorded.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(activeTab === 'INCOMING' || activeTab === 'OUTGOING') && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden max-w-4xl animate-in zoom-in-95 duration-300">
          <div className={`p-8 text-white flex justify-between items-center ${activeTab === 'INCOMING' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest">{activeTab} Entry</h3>
              <p className="text-xs opacity-80 mt-1 font-medium">Record {activeTab.toLowerCase()} stock movement for audit.</p>
            </div>
            <i className={`fa-solid ${activeTab === 'INCOMING' ? 'fa-truck-ramp-box' : 'fa-hand-holding-hand'} text-4xl opacity-20`}></i>
          </div>
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 col-span-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / Supply Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sterile Gloves (Medium)"
                value={formData.item}
                onChange={e => setFormData({...formData, item: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm"
                required
              />
            </div>
            
            {activeTab === 'INCOMING' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO / Invoice Number</label>
                <input 
                  type="text" 
                  placeholder="PO-2024-XXX"
                  value={formData.poNumber}
                  onChange={e => setFormData({...formData, poNumber: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issuing To (Staff Name)</label>
                  <input 
                    type="text" 
                    placeholder="Staff Full Name"
                    value={formData.staffName}
                    onChange={e => setFormData({...formData, staffName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/5 outline-none font-bold text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Surgery, Lab"
                    value={formData.staffDepartment}
                    onChange={e => setFormData({...formData, staffDepartment: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500/5 outline-none font-bold text-sm"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specification / Batch</label>
              <input 
                type="text" 
                placeholder="Model, Batch #, or Size"
                value={formData.specification}
                onChange={e => setFormData({...formData, specification: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-900/5 outline-none font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Packaging Unit</label>
                <select 
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none outline-none"
                >
                  <option>Pieces</option><option>Boxes</option><option>Kits</option><option>Liters</option><option>Rolls</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                <input 
                  type="number" 
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none"
                />
              </div>
            </div>

            {activeTab === 'INCOMING' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price (SLE)</label>
                <div className="relative">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SLE</span>
                   <input 
                    type="number" 
                    value={formData.unitPrice}
                    onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-500/5"
                  />
                </div>
              </div>
            )}

            {activeTab === 'INCOMING' && (
              <div className="col-span-full p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Calculated Inventory Value</p>
                  <p className="text-xs text-emerald-500 font-medium italic mt-1">{formData.quantity} {formData.unit} × SLE {formData.unitPrice.toLocaleString()}</p>
                </div>
                <div className="text-2xl font-black text-emerald-700">SLE {calculatedTotal.toLocaleString()}</div>
              </div>
            )}

            <div className="col-span-full pt-8 flex justify-end items-center space-x-6 border-t border-slate-50">
              <button 
                onClick={() => setActiveTab('LIST')} 
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel Entry
              </button>
              <button 
                onClick={() => handleSubmit(activeTab)}
                className={`px-12 py-5 rounded-[1.8rem] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${activeTab === 'INCOMING' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'}`}
              >
                Commit {activeTab} Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreModule;
