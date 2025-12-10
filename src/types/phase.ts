export interface Phase {
  _id: string;
  phaseNumber: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  affirmation: string;
  isCompleted: boolean;
}
