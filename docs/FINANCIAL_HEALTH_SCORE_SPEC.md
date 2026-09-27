# Financial Health Score — Specification Document

**Status:** Core feature, Fakka's flagship (merged into main 2026-09-27; kill switch: `ENABLE_HEALTH_SCORE`)  
**Created:** 2026-09-27  
**Owner:** Fakka Team

---

## Overview

The **Financial Health Score** is a 0-100 metric that gives users a clear, actionable snapshot of their overall financial health. It's the primary hook and differentiator for Fakka, turning the app from "an expense tracker" into "your financial wellness platform."

The score educates, motivates, and drives engagement by showing users the real impact of their financial decisions in a simple, shareable metric.

---

## Why This Feature

**The Problem:**  
Egyptians managing BNPL installments, loans, savings, and income have no unified view of whether they're financially healthy. No existing app shows the total picture.

**The Solution:**  
A single 0-100 score that ties together:
- How much of your income is locked into installments (the biggest stress factor)
- Whether you can survive a crisis (emergency fund)
- Your net worth trajectory (debt vs. assets)
- Diversification of savings (EGP, USD, EUR, gold)
- Income predictability (salary vs. freelance)

**Why It Works:**  
- **Simple:** Everyone understands 0-100.
- **Motivating:** Users watch it improve month-to-month.
- **Shareable:** A number is less risky than actual financial data.
- **Defensible:** Hard to copy without Egypt-specific tuning.
- **Engaging:** Users return to watch it move.

---

## Score Formula

### Components and Weights

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Installment Load Ratio** | 40% | % of monthly income locked into BNPL/loans |
| **Emergency Fund Adequacy** | 20% | Can you survive 3 months without income? |
| **Debt-to-Assets Ratio** | 15% | Total debt vs. total assets (savings, gold, forex) |
| **Savings Diversification** | 15% | How spread across EGP, USD, EUR, gold? |
| **Income Stability** | 10% | Predictable salary vs. spotty freelance? |

---

## Scoring Methodology

### 1. Installment Load Ratio (40%)

**Formula:**  
```
monthly_bnpl_payments = sum of all active installment payments (valU, Souhoola, Klivvr, Contact, etc.)
load_ratio = monthly_bnpl_payments / monthly_income

if load_ratio <= 0.20: score_component = 100  (Excellent: 0-20% of income)
if load_ratio <= 0.35: score_component = 80   (Good: 20-35%)
if load_ratio <= 0.50: score_component = 60   (Fair: 35-50%)
if load_ratio <= 0.70: score_component = 40   (Warning: 50-70%)
if load_ratio > 0.70:  score_component = 20   (Critical: >70%)
```

**Why This Matters:**  
This is the primary stress factor in Egypt. More than 70% of income in installments = financial fragility. This component alone is worth 40% of the score.

---

### 2. Emergency Fund Adequacy (20%)

**Formula:**  
```
liquid_savings = EGP in checking/savings (not gold, not forex yet)
monthly_expenses = user's actual average monthly spend (from tracked expenses)
months_covered = liquid_savings / monthly_expenses

if months_covered >= 6: score_component = 100  (Excellent: 6+ months)
if months_covered >= 3: score_component = 80   (Good: 3-6 months)
if months_covered >= 1: score_component = 60   (Fair: 1-3 months)
if months_covered > 0:  score_component = 40   (Warning: <1 month)
if months_covered == 0: score_component = 0    (Critical: no emergency fund)
```

**Why This Matters:**  
Can you survive a job loss? A medical emergency? This is the safety net. A 3-month fund is the minimum; 6+ is healthy.

---

### 3. Debt-to-Assets Ratio (15%)

**Formula:**  
```
total_debt = sum of all active installments + loans
total_assets = liquid_savings (EGP) + gold_value (EGP) + forex_savings (EGP)
net_worth = total_assets - total_debt

if net_worth > 0:
  if net_worth > total_debt * 2: score_component = 100  (Excellent: 2:1+ assets to debt)
  if net_worth > total_debt:     score_component = 80   (Good: 1:1+ ratio)
  if net_worth > 0:              score_component = 60   (Fair: positive net worth)
else:
  if net_worth > (total_debt * -0.5): score_component = 40  (Warning: debt < 2x assets)
  else:                                score_component = 20  (Critical: deeply indebted)
```

**Why This Matters:**  
Moving from negative to positive net worth is a key milestone. This component tracks trajectory.

---

### 4. Savings Diversification (15%)

**Formula:**  
```
egp_pct = EGP_savings / total_savings
usd_pct = USD_savings_in_egp / total_savings
eur_pct = EUR_savings_in_egp / total_savings
gold_pct = gold_value_in_egp / total_savings

diversification_score = penalty if any single asset > 80% of total

if max(egp_pct, usd_pct, eur_pct, gold_pct) <= 0.60: score_component = 100
if max(...) <= 0.70: score_component = 80
if max(...) <= 0.85: score_component = 60
if max(...) > 0.85:  score_component = 40
if total_savings == 0: score_component = 0
```

**Why This Matters:**  
Egyptians holding only EGP are vulnerable to devaluation. Holding only gold means liquidity risk. Spread reduces risk.

---

### 5. Income Stability (10%)

**Formula:**  
```
if user_marked_income_type == "salary": 
  score_component = 100  (Stable, predictable)
if user_marked_income_type == "business_owner":
  coefficient = actual_income_variance
  if coefficient <= 0.15: score_component = 80  (Relatively stable)
  if coefficient <= 0.30: score_component = 60  (Moderate volatility)
  if coefficient > 0.30:  score_component = 40  (High volatility)
```

**Why This Matters:**  
Salary gives you confidence; freelance/business income doesn't. Less weight (10%), but meaningful.

---

## Final Score Calculation

```
Final Score = (40% × load_score) + (20% × emergency_score) + (15% × debt_score) + (15% × diversity_score) + (10% × stability_score)

Round to nearest integer (0-100)
```

### Score Bands and Messaging

| Range | Label | Color | Tone | Action |
|-------|-------|-------|------|--------|
| 85-100 | Excellent | Green | "You're in great shape!" | Keep building |
| 70-84 | Healthy | Light Green | "On the right track" | Stay the course |
| 50-69 | Fair | Yellow | "Room for improvement" | Focus on weak areas |
| 30-49 | Warning | Orange | "Caution: fragile" | Take action soon |
| 0-29 | Critical | Red | "Urgent: at risk" | Seek guidance |

---

## Real-World Examples

### Example 1: Over-Leveraged
- **Income:** 10,000 EGP/month  
- **Installments:** 6,500 EGP/month (valU 2K, Souhoola 2.5K, Klivvr 2K)  
- **Liquid savings:** 0 EGP  
- **Total assets:** 15,000 EGP gold + 5,000 EGP forex = 20,000 EGP  
- **Total debt:** 6,500 × remaining_months = 65,000 EGP  

**Scores:**
- Load: 65% → 40 points
- Emergency: 0 months → 0 points
- Debt-to-Assets: -45,000 net worth → 20 points
- Diversity: Gold 60%, Forex 25%, Liquid 15% → 60 points
- Stability: Salary → 100 points

**Final: (40% × 40) + (20% × 0) + (15% × 20) + (15% × 60) + (10% × 100) = 16 + 0 + 3 + 9 + 10 = 38 (Critical)**

---

### Example 2: Healthy
- **Income:** 15,000 EGP/month  
- **Installments:** 3,000 EGP/month (one valU plan)  
- **Liquid savings:** 40,000 EGP  
- **Total assets:** 30,000 EGP (25K gold, 15K USD in EGP, 40K EGP liquid) = 80,000 EGP  
- **Total debt:** 36,000 EGP  

**Scores:**
- Load: 20% → 100 points
- Emergency: 13 months → 100 points
- Debt-to-Assets: +44,000 net worth (2:2 ratio) → 80 points
- Diversity: EGP 50%, Gold 31%, USD 19% → 100 points
- Stability: Salary → 100 points

**Final: (40% × 100) + (20% × 100) + (15% × 80) + (15% × 100) + (10% × 100) = 40 + 20 + 12 + 15 + 10 = 97 (Excellent)**

---

## Implementation Details

### Feature Flag

```javascript
// In your config or env
const ENABLE_HEALTH_SCORE = true; // Set to false to disable feature entirely
```

### Data Used (from the app's store)

- Installments and loans: monthly payment against monthly income (installment load); remaining balances (debt)
- Savings: cash/bank, USD, EUR and gold 21K/24K, valued at live rates (emergency fund and savings mix)
- Monthly payments plus this month's spending: monthly outgoings for the emergency-fund months
- Income sources and job type (Profile → work): income stability
- Assets vs debt: the same numbers as "What you're worth" on Home

### UI (built)

1. **Home card**: score, band badge, progress bar, "▲ n since last month"
2. **Detail sheet** (tap the card): big score, top 3 tips from the weakest parts, all 5 parts with bars and a one-line explanation
3. Fully translated to Arabic; follows light/dark theme

### When to Calculate

- **On app open:** Refresh the score (fast lookup)
- **After transaction logged:** Recalculate (if expense/income changes load or emergency fund)
- **Daily:** Background refresh once per day
- **On-demand:** User taps "Recalculate" button

### Edge Cases

1. **No income logged yet:**  
   → Show "Enter your monthly income to see your score"
   
2. **No expenses tracked yet:**  
   → Calculate emergency fund differently (use a default or ask user to estimate)
   
3. **Zero installments:**  
   → Load component = 100 (excellent)
   
4. **Negative net worth, but improving:**  
   → Show both score and trend ("Critical, but +5 points this month")

---

## Metrics & Analytics (Future)

Once live, track:
- Average score by age group / region
- Most common bottleneck (which component drags most users down?)
- Correlation: score improvement → lower new installment defaults?
- Retention: Do users with higher scores return more often?

---

## Checkpoint & Iteration

This feature is behind a **feature flag**. If you want to:
- **Disable it:** Set `ENABLE_HEALTH_SCORE = false`
- **Delete it:** Remove the flag and `/src/features/HealthScore/` folder
- **Refine it:** Adjust weights/thresholds based on real user data

**No other part of the app is affected.**

---

## Next Steps

1. ✅ Spec document (this file)
2. ✅ Feature flag setup in code
3. ✅ Score calculation engine
4. ✅ UI components (Home card + detail sheet)
5. ✅ Data integration with existing transaction/savings data
6. ⏳ Testing & validation with real Egypt financial patterns
7. ⏳ Analytics tracking

---

**Document Version:** 1.0  
**Last Updated:** 2026-09-27  
**Next Review:** After first user testing
