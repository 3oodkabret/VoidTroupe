import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalyzeResponse } from '@workspace/api-client-react/src/generated/api.schemas';

interface AnalysisState {
  currentResult: AnalyzeResponse | null;
  setResult: (result: AnalyzeResponse) => void;
  clearResult: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentResult: null,
      setResult: (result) => set({ currentResult: result }),
      clearResult: () => set({ currentResult: null }),
    }),
    {
      name: 'void-troupe-analysis',
    }
  )
);
