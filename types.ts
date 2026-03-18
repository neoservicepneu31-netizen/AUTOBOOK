
export enum Screen {
  AUTH = 'AUTH',
  GARAGE = 'GARAGE',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  ADD_INVOICE = 'ADD_INVOICE',
  SELL_CAR = 'SELL_CAR',
  BUY_CAR = 'BUY_CAR',
  ASSISTANCE = 'ASSISTANCE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  INVOICES_LIST = 'INVOICES_LIST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  clientType?: 'new' | 'existing';
  isValidated?: boolean;
  passwordResetRequested?: boolean;
  isPremium?: boolean;
  rememberMe?: boolean;
  hasSivAccess?: boolean;
  hasAssistanceAccess?: boolean;
  createdAt?: string;
}

export interface TechnicalSpecs {
  tireDimensions?: string;
  tirePressureFront?: string;
  tirePressureRear?: string;
  oilViscosity?: string;
  oilCapacity?: string;
  oilQuantity?: string;
  batteryRef?: string;
  colorCode?: string;
  timingBeltIntervalKm?: number;
  timingBeltIntervalYears?: number;
  sparkPlugsIntervalKm?: number;
  coolantType?: string;
  brakeFluidType?: string;
  filterRefs?: string[];
  mechanicalParts?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  /**
   * Updated category to include all values used in the application.
   */
  category: 'REGLEMENTATION' | 'NOUVEAUTE' | 'CONSEIL' | 'ALERT' | 'ELECTRIQUE' | 'ECONOMIE' | 'MARCHÉ';
  date: string;
  summary: string;
  content: string;
  imageUrl: string;
  readTime: string;
}

export interface Car {
  id: string;
  ownerId: string;
  name: string;
  type: 'car' | 'motorcycle';
  plate: string;
  firstRegistrationDate: string;
  fuelType: 'diesel' | 'essence' | 'hybride' | 'electrique';
  initialKm: number;
  grayCardUrl: string | null;
  photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
    engine: string | null;
    damages: string[];
  };
  initialState: {
    tires: 'good' | 'average' | 'bad';
    brakes: 'good' | 'average' | 'bad';
    body: 'good' | 'average' | 'bad';
    interior: 'good' | 'average' | 'bad';
    engine: 'good' | 'average' | 'bad';
  };
  specs?: TechnicalSpecs;
  insurance?: {
    contractNumber?: string;
    assistancePhone?: string;
    greenCardUrl?: string;
  };
}

export interface Invoice {
  id: string;
  carId: string;
  type: 'maintenance' | 'fuel';
  title: string;
  date: string;
  km: number;
  price: number;
  volume?: number;
  imageUrl?: string;
  secureStorageId?: string;
  detectedSpecs?: TechnicalSpecs;
}

export interface AIStatus {
  status: 'success' | 'warning' | 'neutral' | 'critical';
  message: string;
  nextDeadline?: string;
}

export interface ManufacturerSpecs {
  tirePressureFront: string;
  tirePressureRear: string;
  oilType: string;
  maintenanceIntervalKm: number;
  timingBeltIntervalKm?: number;
  coolantType: string;
  checkPoints: string[];
}
