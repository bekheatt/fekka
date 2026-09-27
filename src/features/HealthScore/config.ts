/**
 * Financial Health Score Feature Flag
 *
 * Set ENABLE_HEALTH_SCORE to true to activate the Health Score feature.
 * When false, all Health Score UI and calculations are bypassed.
 *
 * This is a checkpoint feature: if you decide to scrap it, simply:
 * 1. Set ENABLE_HEALTH_SCORE = false
 * 2. All Health Score code becomes inert (no performance impact)
 * 3. Later: rm -rf src/features/HealthScore/ and remove this flag
 */

export const FEATURE_FLAGS = {
  ENABLE_HEALTH_SCORE: true, // Change to false to disable without deleting code
};

// Feature flag checker
export const isHealthScoreEnabled = (): boolean => {
  return FEATURE_FLAGS.ENABLE_HEALTH_SCORE;
};
