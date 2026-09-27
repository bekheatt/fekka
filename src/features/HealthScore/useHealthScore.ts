/**
 * React Hook for Financial Health Score
 *
 * Usage:
 * const { score, breakdown, isLoading, error } = useHealthScore(userFinancialData);
 */

import { useState, useEffect } from 'react';
import { calculateHealthScore, getHealthScoreRecommendations } from './calculator';
import {
  UserFinancialData,
  HealthScoreResult,
  HealthScoreState,
} from './types';
import { isHealthScoreEnabled } from './config';

interface UseHealthScoreReturn {
  score: HealthScoreResult | null;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  recalculate: (data: UserFinancialData) => void;
}

export const useHealthScore = (
  data: UserFinancialData | null,
  previousScore?: number
): UseHealthScoreReturn => {
  const [state, setState] = useState<HealthScoreState>({
    isCalculating: false,
    lastCalculatedAt: null,
    error: null,
    data: null,
  });

  // Early return if feature is disabled
  if (!isHealthScoreEnabled()) {
    return {
      score: null,
      recommendations: [],
      isLoading: false,
      error: null,
      recalculate: () => {},
    };
  }

  // Calculate score when data changes
  useEffect(() => {
    if (!data) {
      setState((prev) => ({ ...prev, data: null }));
      return;
    }

    setState((prev) => ({ ...prev, isCalculating: true }));

    // Use setTimeout to prevent blocking the main thread
    const timer = setTimeout(() => {
      try {
        const result = calculateHealthScore(data, previousScore);
        setState({
          isCalculating: false,
          lastCalculatedAt: new Date(),
          error: null,
          data: result,
        });
      } catch (err) {
        setState({
          isCalculating: false,
          lastCalculatedAt: null,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to calculate health score',
          data: null,
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [data, previousScore]);

  const recalculate = (newData: UserFinancialData) => {
    setState((prev) => ({ ...prev, isCalculating: true }));
    const timer = setTimeout(() => {
      try {
        const result = calculateHealthScore(newData, state.data?.finalScore);
        setState({
          isCalculating: false,
          lastCalculatedAt: new Date(),
          error: null,
          data: result,
        });
      } catch (err) {
        setState({
          isCalculating: false,
          lastCalculatedAt: null,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to calculate health score',
          data: null,
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  };

  return {
    score: state.data,
    recommendations: state.data
      ? getHealthScoreRecommendations(state.data.breakdown)
      : [],
    isLoading: state.isCalculating,
    error: state.error,
    recalculate,
  };
};
