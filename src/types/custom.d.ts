declare module '@/providers/AuthProvider' {
  export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;
}

declare module '@/models/schema' {
  import { Document, Model } from 'mongoose';
  
  interface UserInterface extends Document {
    name: string;
    email: string;
    password: string;
    programStartDate: Date;
    currentPhaseNumber: number;
  }
  
  interface PhaseInterface extends Document {
    userId: string;
    phaseNumber: number;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    affirmationText: string;
    isCompleted: boolean;
  }
  
  interface ProductInterface extends Document {
    name: string;
    category: string;
    description: string;
    recommendedDosage: string;
    recommendedFrequency: string;
  }
  
  interface ProductUsageInterface extends Document {
    userId: string;
    productId: string;
    date: Date;
    actualDosage: string;
    notes: string;
  }
  
  interface ModalityInterface extends Document {
    name: string;
    description: string;
    recommendedFrequency: string;
    recommendedDuration: string;
  }
  
  interface ModalitySessionInterface extends Document {
    userId: string;
    modalityId: string;
    date: Date;
    duration: number;
    notes: string;
  }
  
  interface ProgressNoteInterface extends Document {
    userId: string;
    date: Date;
    content: string;
    biomarkers: {
      name: string;
      value: string;
    }[];
  }
  
  export const User: Model<UserInterface>;
  export const Phase: Model<PhaseInterface>;
  export const Product: Model<ProductInterface>;
  export const ProductUsage: Model<ProductUsageInterface>;
  export const Modality: Model<ModalityInterface>;
  export const ModalitySession: Model<ModalitySessionInterface>;
  export const ProgressNote: Model<ProgressNoteInterface>;
}

declare module '@/lib/db' {
  export function connectDB(): Promise<void>;
}
