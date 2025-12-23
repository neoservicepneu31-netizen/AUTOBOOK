

export enum Screen {
  AUTH = 'AUTH',
  GARAGE = 'GARAGE',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  ADD_INVOICE = 'ADD_INVOICE',
  SELL_CAR = 'SELL_CAR',
  BUY_CAR = 'BUY_CAR',
  ASSISTANCE = 'ASSISTANCE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD' // Nouvel écran Admin
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Ajout pour la mémorisation
  role: 'user' | 'admin'; // Rôle de sécurité
  clientType?: 'new' | 'existing';
  isValidated?: boolean; // Validation par l'admin
  passwordResetRequested?: boolean; // Demande de reset en attente
  
  // --- MONÉTISATION ---
  isPremium?: boolean;          // 5€ (Tout inclus)
  hasSivAccess?: boolean;       // 1€ (Plaque immat)
  hasAssistanceAccess?: boolean;// 1€ (Assistance)
}

export interface TechnicalSpecs {
  // Pneus & Freins
  tireDimensions?: string; // ex: 205/55 R16
  tirePressure?: string;   // ex: 2.5 bar AV / 2.4 bar AR
  
  // Fluides & Batterie
  oilViscosity?: string;   // ex: 5W30
  oilCapacity?: string;    // ex: 4.5L
  batteryRef?: string;     // ex: 70Ah 640A
  colorCode?: string;      // ex: EWP (Blanc Banquise)
  
  // Filtres & Consommables
  oilFilterRef?: string;   // ex: Purflux L398a
  airFilterRef?: string;   // ex: Mann C2512
  fuelFilterRef?: string;  // ex: Bosch F026
  cabinFilterRef?: string; // ex: Valeo 715
  wiperRef?: string;       // ex: Bosch A123S
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
  ownerId: string; // Lien sécurisé vers le propriétaire
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
  // La mémoire technique du véhicule
  specs?: TechnicalSpecs;
  // Assurance
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
  secureStorageId?: string; // ID du fichier dans le coffre-fort
  // Infos techniques détectées dans cette facture
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