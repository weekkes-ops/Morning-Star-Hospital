import React, { useState } from 'react';
import { Employee, User, UserStatus, UserRole } from '../types';

interface HRModuleProps {
  employees: Employee[];
  users: User[];
  onAddEmployee: (employee: Employee) => void;
  onApproveUser: (userId: string) => void;
  onSuspendUser: (userId: string) => void;
}

const HRModule: React.FC<HRModuleProps> = ({ employees, users, onAddEmployee, onApproveUser, onSuspendUser }) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'USERS'>('STAFF');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    mobile: '',
    address: '',
    department: 'Medical',
    salary: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nasit = formData.salary * 0.05;
    const newEmployee: Employee = {
      ...formData,
      id: `E-${Math.floor(1000 + Math.random() * 9000)}`,
      nasit,
      netSalary: formData.salary - nasit,
      attendanceCount: 0,
      leaveDays: 0
    };
    onAddEmployee(newEmployee);
    setShowAddForm(false);
    setFormData({ name: '', dob: '', mobile: '', address: '', department: 'Medical', salary: 0 });
    alert("Employee record created and saved.");
  };

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);
  const activeUsers = users.filter(u => u.status === UserStatus.APPROVED);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Personnel & Administration</h3>
          <p className="text-slate-500 text-sm font-medium">Manage hospital human capital and access control.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('STAFF')} 
             className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'STAFF' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Staff Directory
           </button>
           <button 
             onClick={() => setActiveTab('USERS')} 
             className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center ${activeTab === 'USERS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
             System Access {pendingUsers.length > 0 && <span className="ml-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px]">{pendingUsers.length}</span>}
           </button>
        </div>
      </div>

      {activeTab === 'STAFF' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform"><i className="fa-solid fa-money-bill-transfer text-7xl"></i></div>
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Monthly Liability</p>
               <h4 className="text-3xl font-black">SLE {employees.reduce((acc, curr) => acc + curr.salary, 0).toLocaleString()}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NASIT Trust Fund</p>
              <h4 className="text-3xl font-black text-blue-600">SLE {employees.reduce((acc, curr) => acc + curr.nasit, 0).toLocaleString()}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Headcount</p>
              <h4 className="text-3xl font-black text-emerald-600">{employees.length} Active</h4>
            </div>
          </div>

          <div className="flex justify-end">
             <button 
              onClick={() => setShowAddForm(true)}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/20 transition-all flex items-center group"
            >
              <i className="fa-solid fa-user-plus mr-3 group-hover:rotate-12 transition-transform"></i> Recruit New Staff
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="p-8">Employee ID</th>
                  <th className="p-8">Name & Dept</th>
                  <th className="p-8">Contact</th>
                  <th className="p-8">Base Salary</th>
                  <th className="p-8">NASIT (5%)</th>
                  <th className="p-8 text-right">Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-8 font-mono font-bold text-blue-600 text-xs">{emp.id}</td>
                    <td className="p-8">
                      <div className="font-black text-slate-800 text-sm">{emp.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{emp.department}</div>
                    </td>
                    <td className="p-8 text-slate-600 font-medium text-xs">{emp.mobile}</td>
                    <td className="p-8 font-black text-slate-700 text-sm">SLE {emp.salary.toLocaleString()}</td>
                    <td className="p-8 text-rose-500 font-black text-xs">SLE {emp.nasit.toLocaleString()}</td>
                    <td className="p-8 text-right font-black text-emerald-600 text-sm">SLE {emp.netSalary.toLocaleString()}</td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-32 text-center text-slate-400 italic font-medium">No official staff records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl">
                <h4 className="text-xl font-black mb-2">Access Control</h4>
                <p className="text-blue-100 text-xs font-medium leading-relaxed">
                  Manage staff system access. You can suspend accounts to immediately terminate terminal access or review account statuses.
                </p>
                <div className="mt-8 pt-8 border-t border-blue-500/30 grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Pending Req</p>
                      <p className="text-2xl font-black">{pendingUsers.length}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Authorized</p>
                      <p className="text-2xl font-black">{activeUsers.length}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
             {pendingUsers.length > 0 && (
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] ml-2">Awaiting Approval</h4>
                  <div className="space-y-3">
                    {pendingUsers.map(u => (
                      <div key={u.id} className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
                        <div className="flex items-center space-x-5">
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
                              {u.name.charAt(0)}
                           </div>
                           <div>
                              <h5 className="font-black text-slate-900">{u.name}</h5>
                              <p className="text-[10px] font-bold text-slate-400">{u.email} • Requested: <span className="text-blue-600">{u.role}</span></p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-3">
                           <button 
                             onClick={() => onSuspendUser(u.id)}
                             className="px-6 py-3 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                           >
                             Reject
                           </button>
                           <button 
                             onClick={() => onApproveUser(u.id)}
                             className="px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                           >
                             Grant Access
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Current System Users</h4>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="p-6">User / Identity</th>
                            <th className="p-6">Role Privilege</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.filter(u => u.status !== UserStatus.PENDING).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-6">
                                <p className="font-black text-slate-900 text-sm">{u.name}</p>
                                <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                             </td>
                             <td className="p-6">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                                   {u.role}
                                </span>
                             </td>
                             <td className="p-6">
                                <div className="flex items-center space-x-2">
                                   <div className={`w-2 h-2 rounded-full ${u.status === UserStatus.APPROVED ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                   <span className={`text-[10px] font-black uppercase tracking-widest ${u.status === UserStatus.APPROVED ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {u.status}
                                   </span>
                                </div>
                             </td>
                             <td className="p-6 text-right">
                                {u.role !== UserRole.ADMIN && (
                                   u.status === UserStatus.APPROVED ? (
                                     <button onClick={() => onSuspendUser(u.id)} className="text-rose-500 hover:text-rose-700 transition-colors">
                                        <i className="fa-solid fa-user-slash"></i>
                                     </button>
                                   ) : (
                                     <button onClick={() => onApproveUser(u.id)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
                                        <i className="fa-solid fa-user-check"></i>
                                     </button>
                                   )
                                )}
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-10 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <i className="fa-solid fa-address-card text-9xl"></i>
              </div>
              <h3 className="text-2xl font-black tracking-tight relative z-10">New Employee Registration</h3>
              <p className="text-slate-400 text-sm mt-2 relative z-10">Create official personnel files for payroll and HR management.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                  <option>Medical</option>
                  <option>Nursing</option>
                  <option>Laboratory</option>
                  <option>Pharmacy</option>
                  <option>Administration</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="col-span-full space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-24 resize-none outline-none font-medium text-sm focus:ring-4 focus:ring-blue-500/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Salary (SLE)</label>
                <input required type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg focus:ring-4 focus:ring-blue-500/5" />
              </div>
              <div className="flex items-center pt-8 space-x-6 col-span-full justify-end border-t border-slate-50">
                <button type="button" onClick={() => setShowAddForm(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Discard Form</button>
                <button type="submit" className="px-12 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95">Save Personnel Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRModule;
