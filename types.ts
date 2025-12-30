
export enum Screen {
  AUTH = 'AUTH',
  GARAGE = 'GARAGE',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  ADD_INVOICE = 'ADD_INVOICE',
  SELL_CAR = 'SELL_CAR',
  BUY_CAR = 'BUY_CAR',
  ASSISTANCE = 'ASSISTANCE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  clientType?: 'new' | 'existing';
  isValidated?: boolean;
  passwordResetRequested?: boolean;
  isPremium?: boolean;
  hasSivAccess?: boolean;
  hasAssistanceAccess?: boolean;
}

export interface TechnicalSpecs {
  tireDimensions?: string;
  tirePressure?: string;
  oilViscosity?: string;
  oilCapacity?: string;
  batteryRef?: string;
  colorCode?: string;
  oilFilterRef?: string;
  airFilterRef?: string;
  fuelFilterRef?: string;
  cabinFilterRef?: string;
  wiperRef?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: 'REGLEMENTATION' | 'NOUVEAUTE' | 'CONSEIL' | 'ALERT';
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
  tirePressure: string;
  oilType: string;
  checkPoints: string[];
}

// Global declarations for aistudio are removed to avoid conflict with environment-provided types.
