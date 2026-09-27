/**
 * Financial Health Score: part of the core app (Fakka's flagship).
 * ENABLE_HEALTH_SCORE stays as an emergency off switch. false hides the card and skips all calculations.
 */

export const FEATURE_FLAGS = {
  ENABLE_HEALTH_SCORE: true,
};

// Feature flag checker
export const isHealthScoreEnabled = (): boolean => {
  return FEATURE_FLAGS.ENABLE_HEALTH_SCORE;
};
