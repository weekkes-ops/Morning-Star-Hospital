
export enum PatientStatus {
  REGISTERED = 'Registered',
  WITH_DOCTOR = 'With Doctor',
  IN_LAB = 'In Lab',
  IN_XRAY = 'In X-Ray',
  IN_PHARMACY = 'In Pharmacy',
  COMPLETED = 'Completed'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
  CASHIER = 'CASHIER',
  STORE_KEEPER = 'STORE_KEEPER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENDITURE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: 'CONSULTATION' | 'PHARMACY' | 'LAB' | 'RADIOLOGY' | 'SALARY' | 'SUPPLIES' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
  description: string;
  referenceId?: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  mobile: string;
  date: string;
  isInPatient: boolean;
  bedNumber?: string;
  floor?: string;
  wardNumber?: string;
  clinic: string;
  condition: string;
  consultationFee: number;
  status: PatientStatus;
  doctorNotes?: string;
  selectedTests: string[];
  selectedMedicine: string[];
  selectedXRay: string[];
  labResults?: LabResult[];
  xRayResults?: XRayResult[];
  pharmacySales?: PharmacySale[];
  appointments: Appointment[];
  photoUrl?: string;
}

export interface LabParameter {
  name: string;
  value: string;
  min: string;
  max: string;
  unit: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
}

export interface LabResult {
  testName: string;
  parameters: LabParameter[];
  overallStatus: 'Normal' | 'Abnormal' | 'Critical';
}

export interface XRayResult {
  viewName: string;
  findings: string;
  impression: string;
  technician: string;
}

export interface PharmacySale {
  item: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
}

export interface StoreOrder {
  id: string;
  poNumber?: string;
  date: string;
  item: string;
  specification?: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  total?: number;
  type: 'INCOMING' | 'OUTGOING';
  staffName?: string;
  staffDepartment?: string;
}

export interface Employee {
  id: string;
  name: string;
  dob: string;
  mobile: string;
  address: string;
  department: string;
  salary: number;
  nasit: number;
  netSalary: number;
  attendanceCount: number;
  leaveDays: number;
}

export type ViewType = 'REGISTRATION' | 'DOCTOR' | 'LAB' | 'PHARMACY' | 'STORE' | 'CLINIC' | 'HR' | 'XRAY' | 'DASHBOARD' | 'FINANCE' | 'REPORTS' | 'AUTH';
