import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalyzeResponse } from '@workspace/api-client-react/src/generated/api.schemas';
import type { MbtiResult } from '@/lib/mbti';

interface AnalysisState {
  currentResult: AnalyzeResponse | null;
  mbtiResult: MbtiResult | null;
  setResult: (result: AnalyzeResponse) => void;
  setMbtiResult: (result: MbtiResult) => void;
  clearResult: () => void;
  clearMbtiResult: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      currentResult: null,
      mbtiResult: null,
      setResult: (result) => set({ currentResult: result }),
      setMbtiResult: (result) => set({ mbtiResult: result }),
      clearResult: () => set({ currentResult: null }),
      clearMbtiResult: () => set({ mbtiResult: null }),
    }),
    {
      name: 'void-troupe-analysis',
    }
  )
);
