
import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, Patient, PatientStatus, StoreOrder, Employee, Transaction, User, UserRole, UserStatus } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './modules/Dashboard.tsx';
import Registration from './modules/Registration.tsx';
import DoctorModule from './modules/DoctorModule.tsx';
import LabModule from './modules/LabModule.tsx';
import PharmacyModule from './modules/PharmacyModule.tsx';
import StoreModule from './modules/StoreModule.tsx';
import ClinicModule from './modules/ClinicModule.tsx';
import HRModule from './modules/HRModule.tsx';
import XRayModule from './modules/XRayModule.tsx';
import FinanceModule from './modules/FinanceModule.tsx';
import ReportsModule from './modules/ReportsModule.tsx';
import AuthModule from './modules/AuthModule.tsx';

// Default Fees
const INITIAL_CLINIC_FEES: Record<string, number> = {
  'Urology & Andrology': 350,
  'General Surgery': 450,
  'Orthopedics': 300,
  'Gynecology': 320,
  'Obstetrics & Infertility': 400,
  'GIT, Liver & Endoscopy': 550,
  'Cardiology': 600,
  'Internal Medicine': 280,
  'Pediatrics': 200,
  'Family Medicine': 180
};

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, ViewType[]> = {
  [UserRole.ADMIN]: ['DASHBOARD', 'REGISTRATION', 'DOCTOR', 'LAB', 'XRAY', 'PHARMACY', 'STORE', 'CLINIC', 'FINANCE', 'REPORTS', 'HR'],
  [UserRole.DOCTOR]: ['DASHBOARD', 'DOCTOR', 'CLINIC'],
  [UserRole.NURSE]: ['DASHBOARD', 'REGISTRATION', 'CLINIC'],
  [UserRole.CASHIER]: ['DASHBOARD', 'REGISTRATION', 'PHARMACY', 'FINANCE'],
  [UserRole.PHARMACIST]: ['DASHBOARD', 'PHARMACY', 'STORE'],
  [UserRole.LABORATORY]: ['DASHBOARD', 'LAB'],
  [UserRole.RADIOLOGY]: ['DASHBOARD', 'XRAY'],
  [UserRole.STORE_KEEPER]: ['DASHBOARD', 'STORE'],
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clinicFees, setClinicFees] = useState<Record<string, number>>(INITIAL_CLINIC_FEES);

  // Initialize data
  useEffect(() => {
    const savedPatients = localStorage.getItem('fih_patients');
    const savedTransactions = localStorage.getItem('fih_transactions');
    const savedUsers = localStorage.getItem('fih_users');
    const savedAuth = localStorage.getItem('fih_current_user');
    const savedFees = localStorage.getItem('fih_clinic_fees');

    if (savedPatients) setPatients(JSON.parse(savedPatients));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedFees) setClinicFees(JSON.parse(savedFees));
    
    // Seed default admin if no users exist
    let initialUsers = savedUsers ? JSON.parse(savedUsers) : [];
    if (initialUsers.length === 0) {
      initialUsers = [{
        id: 'ADMIN-001',
        email: 'admin@morningstarhospital.sl',
        password: 'admin123',
        name: 'System Admin',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('fih_users', JSON.stringify(initialUsers));
    }
    setUsers(initialUsers);

    if (savedAuth) setCurrentUser(JSON.parse(savedAuth));
  }, []);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('fih_patients', JSON.stringify(patients));
      localStorage.setItem('fih_transactions', JSON.stringify(transactions));
      localStorage.setItem('fih_users', JSON.stringify(users));
      localStorage.setItem('fih_clinic_fees', JSON.stringify(clinicFees));
      if (currentUser) {
        localStorage.setItem('fih_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('fih_current_user');
      }
    } catch (error) {
      console.error("Storage quota exceeded or error saving data:", error);
      // Optional: alert user or handle fallback
    }
  }, [patients, transactions, users, currentUser, clinicFees]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const handleLogin = (inputEmail: string, pass: string): boolean | string => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    const user = users.find(u => {
      const uEmail = u.email.trim().toLowerCase();
      if (uEmail === cleanEmail && u.password === pass) return true;
      if (u.role === UserRole.ADMIN && u.password === pass && 
         (cleanEmail === 'admin@morningstarhospital.sl' || cleanEmail === 'admin@msh.sl' || cleanEmail === 'admin@fih.sl')) {
        return true;
      }
      return false;
    });
    if (!user) return "Invalid email or password.";
    if (user.status === UserStatus.SUSPENDED) return "Your account has been suspended.";
    
    setCurrentUser(user);
    const allowed = ROLE_PERMISSIONS[user.role];
    if (allowed.length > 0) setCurrentView(allowed[0]);
    return true;
  };

  const handleSignup = (userData: Partial<User>) => {
    const newUser: User = {
      id: `USER-${Date.now()}`,
      email: userData.email!,
      password: userData.password!,
      name: userData.name!,
      role: userData.role!,
      status: UserStatus.APPROVED,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  const addPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
    addTransaction({
      id: `TX-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: patient.consultationFee,
      type: 'INCOME',
      category: 'CONSULTATION',
      description: `Consultation Fee: ${patient.name}`,
      referenceId: patient.id
    });
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [...prev, tx]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const approveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: UserStatus.APPROVED } : u));
  };

  const suspendUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: UserStatus.SUSPENDED } : u));
  };

  if (!currentUser) {
    return <AuthModule onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const hasAccess = (view: ViewType) => {
    return ROLE_PERMISSIONS[currentUser.role].includes(view);
  };

  const renderView = () => {
    if (!hasAccess(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-10 bg-white rounded-[3rem] border border-slate-100">
           <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-shield-halved text-4xl"></i>
           </div>
           <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h3>
           <p className="text-slate-400 font-medium max-w-sm">Your staff role ({currentUser.role}) does not have privileges for the {currentView} module.</p>
           <button onClick={() => setCurrentView('DASHBOARD')} className="mt-8 px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl">Return to Dashboard</button>
        </div>
      );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard patients={patients} orders={storeOrders} employees={employees} transactions={transactions} onViewChange={setCurrentView} />;
      case 'REGISTRATION':
        return <Registration patients={patients} clinicFees={clinicFees} onRegister={addPatient} onUpdate={updatePatient} />;
      case 'DOCTOR':
        return (
          <DoctorModule 
            patients={patients.filter(p => p.status === PatientStatus.REGISTERED || p.status === PatientStatus.WITH_DOCTOR)} 
            allPatients={patients}
            currentUser={currentUser}
            onUpdate={updatePatient} 
          />
        );
      case 'LAB':
        return <LabModule patients={patients.filter(p => p.status === PatientStatus.IN_LAB)} onUpdate={updatePatient} onRecordRevenue={(amt, pid) => addTransaction({
          id: `TX-LAB-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: amt,
          type: 'INCOME',
          category: 'LAB',
          description: `Lab Investigation Fees`,
          referenceId: pid
        })} />;
      case 'PHARMACY':
        return <PharmacyModule 
          patients={patients.filter(p => p.status === PatientStatus.IN_PHARMACY || p.status === PatientStatus.COMPLETED)} 
          onUpdate={updatePatient} 
          onRecordSale={(amt, pid) => addTransaction({
            id: `TX-PHARM-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: amt,
            type: 'INCOME',
            category: 'PHARMACY',
            description: `Medicine Sale Revenue`,
            referenceId: pid
          })}
        />;
      case 'STORE':
        return <StoreModule orders={storeOrders} onAddOrder={(o) => {
          setStoreOrders(prev => [...prev, o]);
          if (o.type === 'INCOMING' && o.total) {
            addTransaction({
              id: `TX-SUPPLY-${Date.now()}`,
              date: o.date,
              amount: o.total,
              type: 'EXPENDITURE',
              category: 'SUPPLIES',
              description: `Inventory Purchase: ${o.item}`,
              referenceId: o.id
            });
          }
        }} />;
      case 'CLINIC':
        return <ClinicModule patients={patients} clinicFees={clinicFees} onUpdateFees={setClinicFees} currentUser={currentUser} />;
      case 'HR':
        return <HRModule 
          employees={employees} 
          users={users} 
          onApproveUser={approveUser}
          onSuspendUser={suspendUser}
          onAddEmployee={(e) => {
            setEmployees(prev => [...prev, e]);
            addTransaction({
              id: `TX-PAYROLL-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount: e.salary,
              type: 'EXPENDITURE',
              category: 'SALARY',
              description: `Payroll Entry: ${e.name}`,
              referenceId: e.id
            });
          }} 
        />;
      case 'XRAY':
        return <XRayModule 
          patients={patients.filter(p => p.status === PatientStatus.IN_XRAY || (p.xRayResults && p.xRayResults.length > 0))} 
          onUpdate={updatePatient} 
          onRecordRevenue={(amt, pid) => addTransaction({
            id: `TX-RAD-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: amt,
            type: 'INCOME',
            category: 'RADIOLOGY',
            description: `Radiology Imaging Fees`,
            referenceId: pid
          })}
        />;
      case 'FINANCE':
        return <FinanceModule transactions={transactions} onAddTransaction={addTransaction} />;
      case 'REPORTS':
        return <ReportsModule transactions={transactions} patients={patients} />;
      default:
        return <Dashboard patients={patients} orders={storeOrders} employees={employees} transactions={transactions} onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Sidebar 
        activeView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        patients={patients}
        currentUser={currentUser}
        onLogout={handleLogout}
        permissions={ROLE_PERMISSIONS[currentUser.role]}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          activeView={currentView} 
          onMenuClick={toggleSidebar}
          currentUser={currentUser}
          patients={patients}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
            {renderView()}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
