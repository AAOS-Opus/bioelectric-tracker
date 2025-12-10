import mongoose, { Schema, Document, Model } from 'mongoose'

// Define all interfaces at the top for better access
export interface NotificationSettingsInterface extends Document {
  userEmail: string
  dailyReminders: boolean
  modalityAlerts: boolean
  weeklyReports: boolean
  channels: {
    email: boolean
    sms: boolean
    inApp: boolean
  }
  preferredTime: string
  timezone: string
  phoneNumber?: string
}

export interface NotificationInterface extends Document {
  userEmail: string
  type: string
  title: string
  message: string
  status: 'pending' | 'sent' | 'read' | 'failed'
  priority: 'low' | 'medium' | 'high'
  category: 'protocol' | 'device' | 'progress' | 'health' | 'maintenance'
  scheduledFor: Date
  sentAt?: Date
  readAt?: Date
  metadata: {
    phaseNumber?: number
    modalityId?: mongoose.Types.ObjectId | string
    reportUrl?: string
    actionRequired?: boolean
    achievementType?: 'streak' | 'milestone' | 'improvement'
    biomarkerType?: string
    biomarkerValue?: number
    deviceType?: string
    [key: string]: any
  }
  style?: {
    icon?: string
    color?: string
    image?: string
  }
  createdAt?: Date
  updatedAt?: Date
}

export interface ModalitySessionInterface extends Document {
  userEmail: string
  type: 'Spooky Scalar' | 'MWO'
  date: Date
  duration: number
  completed: boolean
  notes?: string
  _id: mongoose.Types.ObjectId | string
}

export interface ProgressNoteInterface extends Document {
  userEmail: string
  date: Date
  biomarkers: Map<string, number> | Record<string, number>
  notes: string
  attachments?: string[]
}

// Define existing interfaces
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    programStartDate: Date;
    currentPhaseNumber: number;
    complianceStreak: number;
    createdAt: Date;
}

export interface IPhase extends Document {
    phaseNumber: number;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    affirmationText?: string;
    isCompleted: boolean;
}

export interface IProduct extends Document {
    name: string;
    category: 'Detox' | 'Mitochondrial' | 'Other';
    description: string;
    dosageInstructions: string;
    frequency: string;
    phaseNumbers: number[];
}

export interface IProductUsage extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    date: Date;
    timestamp: Date;
    status: 'completed' | 'missed' | 'scheduled';
    isCompleted: boolean;
}

export interface IModality extends Document {
    name: string;
    description: string;
    recommendedFrequency: string;
}

export interface IModalitySession extends Document {
    userId: mongoose.Types.ObjectId;
    modalityId: mongoose.Types.ObjectId;
    date: Date;
    duration: number;
    isCompleted: boolean;
    notes?: string;
}

export interface IProgressNote extends Document {
    userId: mongoose.Types.ObjectId;
    phaseId: mongoose.Types.ObjectId;
    date: Date;
    weekNumber: number;
    content: string;
    biomarkerData: Map<string, any>;
}

// User Schema
const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    programStartDate: { type: Date, required: true },
    currentPhaseNumber: { type: Number, min: 1, max: 4, required: true },
    complianceStreak: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
});

// Phase Schema
const phaseSchema = new Schema<IPhase>({
    phaseNumber: { type: Number, min: 1, max: 4, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    affirmationText: { type: String },
    isCompleted: { type: Boolean, default: false },
});

// Product Schema
const productSchema = new Schema<IProduct>({
    name: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Detox', 'Mitochondrial', 'Other'],
    },
    description: { type: String, required: true },
    dosageInstructions: { type: String, required: true },
    frequency: { type: String, required: true },
    phaseNumbers: { type: [Number], required: true, default: [] },
});

// Product Usage Schema
const productUsageSchema = new Schema<IProductUsage>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    date: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['completed', 'missed', 'scheduled'],
        default: 'completed'
    },
    isCompleted: { type: Boolean, default: false },
});

// Modality Schema
const modalitySchema = new Schema<IModality>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    recommendedFrequency: { type: String, required: true },
});

// Modality Session Schema
const modalitySessionSchema = new Schema<ModalitySessionInterface>({
    userEmail: { type: String, required: true },
    type: { 
        type: String,
        enum: ['Spooky Scalar', 'MWO'],
        required: true
    },
    date: { type: Date, required: true },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    notes: { type: String }
}, { timestamps: true })

// Progress Note Schema
const progressNoteSchema = new Schema<ProgressNoteInterface>({
    userEmail: { type: String, required: true },
    date: { type: Date, required: true },
    biomarkers: {
        type: Map,
        of: Number,
        default: new Map()
    },
    notes: { type: String, required: true },
    attachments: [{ type: String }]
}, { timestamps: true })

// Notification Settings Schema
const notificationSettingsSchema = new Schema<NotificationSettingsInterface>({
    userEmail: { type: String, required: true, unique: true },
    dailyReminders: { type: Boolean, default: true },
    modalityAlerts: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    channels: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true }
    },
    preferredTime: { type: String, default: '09:00' },
    timezone: { type: String, default: 'UTC' },
    phoneNumber: { type: String }
})

// Notification Schema
const notificationSchema = new Schema<NotificationInterface>({
  userEmail: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'read', 'failed'],
    default: 'pending'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: { 
    type: String, 
    enum: ['protocol', 'device', 'progress', 'health', 'maintenance'],
    required: true
  },
  scheduledFor: { type: Date, required: true },
  sentAt: { type: Date },
  readAt: { type: Date },
  metadata: {
    phaseNumber: { type: Number },
    modalityId: { type: Schema.Types.ObjectId, ref: 'Modality' },
    reportUrl: { type: String },
    actionRequired: { type: Boolean, default: false },
    achievementType: { 
      type: String, 
      enum: ['streak', 'milestone', 'improvement'] 
    },
    biomarkerType: { type: String },
    biomarkerValue: { type: Number },
    deviceType: { type: String }
  },
  style: {
    icon: { type: String },
    color: { type: String },
    image: { type: String }
  }
}, { timestamps: true });

// Progress Note Schema
const progressNoteSchema2 = new Schema<IProgressNote>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true },
    date: { type: Date, required: true },
    weekNumber: { type: Number, required: true },
    content: { type: String, required: true },
    biomarkerData: {
        type: Map,
        of: Schema.Types.Mixed,
    },
});

// Need to check if models are already defined to avoid overwriting in Next.js development with hot reload
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Phase = mongoose.models.Phase || mongoose.model<IPhase>('Phase', phaseSchema);
export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export const ProductUsage = mongoose.models.ProductUsage || mongoose.model<IProductUsage>('ProductUsage', productUsageSchema);
export const Modality = mongoose.models.Modality || mongoose.model<IModality>('Modality', modalitySchema);

// Export notification models
export const NotificationSettings = mongoose.models.NotificationSettings 
  ? mongoose.models.NotificationSettings as Model<NotificationSettingsInterface>
  : mongoose.model<NotificationSettingsInterface>('NotificationSettings', notificationSettingsSchema);

export const Notification = mongoose.models.Notification 
  ? mongoose.models.Notification as Model<NotificationInterface>
  : mongoose.model<NotificationInterface>('Notification', notificationSchema);

export const ModalitySession = (mongoose.models.ModalitySession || mongoose.model<ModalitySessionInterface>('ModalitySession', modalitySessionSchema)) as Model<ModalitySessionInterface>;

export const ProgressNote = (mongoose.models.ProgressNote || mongoose.model<ProgressNoteInterface>('ProgressNote', progressNoteSchema)) as Model<ProgressNoteInterface>;
export const ProgressNote2 = mongoose.models.ProgressNote2 || mongoose.model<IProgressNote>('ProgressNote2', progressNoteSchema2);
