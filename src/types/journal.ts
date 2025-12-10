export type Emotion = 
  | 'joyful'
  | 'optimistic'
  | 'content'
  | 'neutral'
  | 'fatigued'
  | 'anxious'
  | 'frustrated'
  | 'discouraged';

export interface JournalEntry {
  id: string;
  title: string;
  content: string; // Can be Draft.js content as JSON string
  date: string; // ISO date string
  emotion: Emotion;
  tags: string[];
  isDraft: boolean;
  isShared: boolean;
  sharedWith?: string[]; // Array of practitioner IDs
  phaseId?: string; // Optional reference to which protocol phase this entry belongs to
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  userId: string;
}

export interface JournalFilter {
  text: string;
  tags: string[];
  emotions: Emotion[];
  dateRange: DateRange | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface JournalEntryFormData {
  title: string;
  content: string;
  emotion: Emotion;
  tags: string[];
  isDraft: boolean;
  isShared: boolean;
  sharedWith?: string[];
}

export interface JournalStatistics {
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  emotionDistribution: Record<Emotion, number>;
  entriesByPhase: {
    phaseId: string;
    phaseName: string;
    count: number;
  }[];
  mostUsedTags: {
    tag: string;
    count: number;
  }[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastEntryDate: string;
  };
}
