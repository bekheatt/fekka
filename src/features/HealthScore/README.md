# Financial Health Score Feature

This directory contains the implementation of Fakka's Financial Health Score — a 0-100 metric that measures overall financial health.

## Files

- **config.ts** — Feature flag to enable/disable the entire feature
- **types.ts** — TypeScript types and interfaces
- **calculator.ts** — Core calculation engine implementing the scoring formula
- **useHealthScore.ts** — React hook for using the score in components
- **index.ts** — Main exports

## How to Use

### In a React Component

```typescript
import { useHealthScore, isHealthScoreEnabled } from '@/features/HealthScore';

export function MyComponent() {
  // Prepare user's financial data
  const userData = {
    monthlyIncome: 15000,
    incomeType: 'salary',
    installments: [...],
    loans: [...],
    savingsEGP: 40000,
    savingsUSD: 1000,
    savingsEUR: 500,
    goldGrams: 12,
    monthlyExpenses: 3000,
  };

  // Use the hook
  const { score, recommendations, isLoading, error } = useHealthScore(userData);

  if (!isHealthScoreEnabled()) {
    return <div>Health Score feature is disabled</div>;
  }

  if (isLoading) {
    return <div>Calculating...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 style={{ color: score.color }}>
        Your Score: {score.finalScore}
      </h1>
      <p>{score.message}</p>
      <ul>
        {recommendations.map((rec, i) => (
          <li key={i}>{rec}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Direct Calculation (No React)

```typescript
import { calculateHealthScore } from '@/features/HealthScore';

const userData = { /* ... */ };
const result = calculateHealthScore(userData);
console.log(result.finalScore); // 0-100
console.log(result.breakdown); // Individual component scores
```

## Feature Flag

To disable the entire Health Score feature without deleting code:

```typescript
// In src/features/HealthScore/config.ts
export const FEATURE_FLAGS = {
  ENABLE_HEALTH_SCORE: false, // Toggle this
};
```

When disabled:
- All calculations are skipped
- `useHealthScore` returns null for score/recommendations
- No performance impact

## Specification

See `/docs/FINANCIAL_HEALTH_SCORE_SPEC.md` for the complete specification including:
- Scoring methodology and weights
- Real-world examples
- Implementation details
- Edge cases

## Checkpoint & Iteration

This feature is designed as a **checkpoint**. If you want to:

1. **Disable it temporarily:**  
   Set `ENABLE_HEALTH_SCORE = false` in config.ts

2. **Delete it completely:**  
   - Set flag to false
   - Delete this entire directory: `rm -rf src/features/HealthScore/`
   - Remove any imports of the feature from the app

3. **Refine it based on user feedback:**  
   Adjust the weights in `calculator.ts` or thresholds in the spec

No other part of the app is affected.

## Next Steps

- [ ] Create UI components for displaying the score
- [ ] Integrate with app's data layer (fetch installments, savings, expenses)
- [ ] Build score trend chart (last 12 months)
- [ ] Create breakdown view (5 component scores)
- [ ] Add analytics tracking
- [ ] Test with real Egyptian financial patterns
- [ ] Gather user feedback and iterate
