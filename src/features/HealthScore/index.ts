// Financial Health Score — everything the rest of the app needs
export { FEATURE_FLAGS, isHealthScoreEnabled } from './config';
export { calculateHealthScore, bandOf, WEIGHTS } from './calculator';
export type { HealthScore, Part, Band, Totals } from './calculator';
export { default as HealthCard, bandColor } from './HealthCard';
