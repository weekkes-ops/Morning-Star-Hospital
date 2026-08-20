
import React from 'react';
import { ViewType, Patient, PatientStatus, User, UserRole } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  currentUser: User;
  onLogout: () => void;
  permissions: ViewType[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose, patients, currentUser, onLogout, permissions }) => {
  const getQueueCount = (view: ViewType) => {
    switch (view) {
      case 'DOCTOR': return patients.filter(p => p.status === PatientStatus.REGISTERED).length;
      case 'LAB': return patients.filter(p => p.status === PatientStatus.IN_LAB).length;
      case 'XRAY': return patients.filter(p => p.status === PatientStatus.IN_XRAY).length;
      case 'PHARMACY': return patients.filter(p => p.status === PatientStatus.IN_PHARMACY).length;
      default: return 0;
    }
  };

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'REGISTRATION', label: 'Patient Intake', icon: 'fa-address-book' },
    { id: 'DOCTOR', label: 'Clinical Queue', icon: 'fa-user-md', badge: true },
    { id: 'LAB', label: 'Laboratory', icon: 'fa-flask-vial', badge: true },
    { id: 'XRAY', label: 'Radiology', icon: 'fa-x-ray', badge: true },
    { id: 'PHARMACY', label: 'Dispensary', icon: 'fa-pills', badge: true },
    { id: 'STORE', label: 'Inventory Store', icon: 'fa-warehouse' },
    { id: 'CLINIC', label: 'Specialty Clinics', icon: 'fa-hospital-user' },
    { id: 'FINANCE', label: 'Finance & Accounts', icon: 'fa-vault' },
    { id: 'REPORTS', label: 'System Reports', icon: 'fa-file-lines' },
    { id: 'HR', label: 'Personnel & Admin', icon: 'fa-users-gear' },
  ].filter(item => permissions.includes(item.id as ViewType));

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      flex flex-col
    `}>
      <div className="px-8 py-10 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <i className="fa-solid fa-star text-white"></i>
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">MSH <span className="text-blue-600">MAIN</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Morning Star Hospital</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const count = item.badge ? getQueueCount(item.id as ViewType) : 0;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeView === item.id 
                  ? 'bg-blue-50 text-blue-700 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-4">
                <i className={`fa-solid ${item.icon} text-lg ${activeView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}></i>
                <span className="text-[13px] tracking-tight">{item.label}</span>
              </div>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  activeView === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12"></div>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 font-black">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-3 py-4 text-[11px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
        >
          <i className="fa-solid fa-power-off"></i>
          <span>Logout Terminal</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
