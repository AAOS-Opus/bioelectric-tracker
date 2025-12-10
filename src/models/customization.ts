import mongoose, { Schema, Document } from 'mongoose';

// User Preferences Schema
export interface UserPreferencesDocument extends Document {
  userId: mongoose.Types.ObjectId;
  dashboardLayout: DashboardLayout;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  dateFormat: string;
  timeFormat: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Layout Schema
export interface DashboardLayout {
  layout: DashboardItem[];
  savedLayouts: {
    name: string;
    layout: DashboardItem[];
  }[];
  defaultLayoutId: string;
}

export interface DashboardItem {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  visible: boolean;
  settings: Record<string, any>;
}

// Custom Biomarker Schema
export interface CustomBiomarkerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: string;
  inputType: 'numeric' | 'scale' | 'boolean' | 'text' | 'date';
  unit: string;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  targetDirection: 'increase' | 'decrease' | 'maintain';
  scaleOptions?: string[];
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Product Customization Schema
export interface ProductCustomizationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  customName?: string;
  customDosage?: string;
  customFrequency?: string;
  customNotes?: string;
  active: boolean;
  phaseAssociations: {
    phaseId: mongoose.Types.ObjectId;
    dosage?: string;
    frequency?: string;
    notes?: string;
  }[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Modality Customization Schema
export interface ModalityCustomizationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  modalityId: mongoose.Types.ObjectId;
  customName?: string;
  customDuration?: number;
  customFrequency?: string;
  customNotes?: string;
  active: boolean;
  phaseAssociations: {
    phaseId: mongoose.Types.ObjectId;
    duration?: number;
    frequency?: string;
    notes?: string;
  }[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Phase Customization Schema
export interface PhaseCustomizationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;
  customName?: string;
  customDescription?: string;
  customAffirmation?: string;
  customDuration?: number;
  customColor?: string;
  customStartDate?: Date;
  customEndDate?: Date;
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definitions

const UserPreferencesSchema = new Schema<UserPreferencesDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dashboardLayout: {
    layout: [{
      id: { type: String, required: true },
      type: { type: String, required: true },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        w: { type: Number, required: true },
        h: { type: Number, required: true }
      },
      visible: { type: Boolean, default: true },
      settings: { type: Schema.Types.Mixed }
    }],
    savedLayouts: [{
      name: { type: String, required: true },
      layout: [{
        id: { type: String, required: true },
        type: { type: String, required: true },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          w: { type: Number, required: true },
          h: { type: Number, required: true }
        },
        visible: { type: Boolean, default: true },
        settings: { type: Schema.Types.Mixed }
      }]
    }],
    defaultLayoutId: { type: String }
  },
  theme: {
    primaryColor: { type: String, default: '#0f766e' },
    secondaryColor: { type: String, default: '#0891b2' },
    accentColor: { type: String, default: '#2dd4bf' },
    darkMode: { type: Boolean, default: false }
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
    dailyDigest: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true }
  },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, default: '12h' },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CustomBiomarkerSchema = new Schema<CustomBiomarkerDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  inputType: { 
    type: String, 
    enum: ['numeric', 'scale', 'boolean', 'text', 'date'],
    required: true 
  },
  unit: { type: String },
  minValue: { type: Number },
  maxValue: { type: Number },
  targetValue: { type: Number },
  targetDirection: { 
    type: String,
    enum: ['increase', 'decrease', 'maintain'],
    default: 'maintain'
  },
  scaleOptions: [{ type: String }],
  active: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ProductCustomizationSchema = new Schema<ProductCustomizationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  customName: { type: String },
  customDosage: { type: String },
  customFrequency: { type: String },
  customNotes: { type: String },
  active: { type: Boolean, default: true },
  phaseAssociations: [{
    phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true },
    dosage: { type: String },
    frequency: { type: String },
    notes: { type: String }
  }],
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ModalityCustomizationSchema = new Schema<ModalityCustomizationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  modalityId: { type: Schema.Types.ObjectId, ref: 'Modality', required: true },
  customName: { type: String },
  customDuration: { type: Number },
  customFrequency: { type: String },
  customNotes: { type: String },
  active: { type: Boolean, default: true },
  phaseAssociations: [{
    phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true },
    duration: { type: Number },
    frequency: { type: String },
    notes: { type: String }
  }],
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PhaseCustomizationSchema = new Schema<PhaseCustomizationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true },
  customName: { type: String },
  customDescription: { type: String },
  customAffirmation: { type: String },
  customDuration: { type: Number },
  customColor: { type: String },
  customStartDate: { type: Date },
  customEndDate: { type: Date },
  active: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models if they don't already exist
export const UserPreferences = mongoose.models.UserPreferences || 
  mongoose.model<UserPreferencesDocument>('UserPreferences', UserPreferencesSchema);

export const CustomBiomarker = mongoose.models.CustomBiomarker || 
  mongoose.model<CustomBiomarkerDocument>('CustomBiomarker', CustomBiomarkerSchema);

export const ProductCustomization = mongoose.models.ProductCustomization || 
  mongoose.model<ProductCustomizationDocument>('ProductCustomization', ProductCustomizationSchema);

export const ModalityCustomization = mongoose.models.ModalityCustomization || 
  mongoose.model<ModalityCustomizationDocument>('ModalityCustomization', ModalityCustomizationSchema);

export const PhaseCustomization = mongoose.models.PhaseCustomization || 
  mongoose.model<PhaseCustomizationDocument>('PhaseCustomization', PhaseCustomizationSchema);

// Versioning middleware for all schemas
const versioningMiddleware = function(this: any, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.version = (this.version || 0) + 1;
  return next();
};

UserPreferencesSchema.pre('save', versioningMiddleware);
CustomBiomarkerSchema.pre('save', versioningMiddleware);
ProductCustomizationSchema.pre('save', versioningMiddleware);
ModalityCustomizationSchema.pre('save', versioningMiddleware);
PhaseCustomizationSchema.pre('save', versioningMiddleware);

// Indexes for performance
UserPreferencesSchema.index({ userId: 1 }, { unique: true });
CustomBiomarkerSchema.index({ userId: 1, name: 1 }, { unique: true });
ProductCustomizationSchema.index({ userId: 1, productId: 1 }, { unique: true });
ModalityCustomizationSchema.index({ userId: 1, modalityId: 1 }, { unique: true });
PhaseCustomizationSchema.index({ userId: 1, phaseId: 1 }, { unique: true });
