export interface RawTestResult {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  status: 'active' | 'in_progress' | 'completed';
}

interface RawTestDivision {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  status: 'active' | 'in_progress' | 'completed';
}

export interface TestDetails {
  id: number;
  title: string;
  total_questions: number;
  total_duration: number;
  status: 'active' | 'in_progress' | 'completed';
  divisions?: RawTestDivision[];
}
