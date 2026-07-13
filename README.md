# The Risk Museum

**Live site: [theriskmuseum.com](https://theriskmuseum.com/)**

A public record of published trading strategies tested with institutional rigor by an autonomous AI research pipeline. Each exhibit records the claim, the source, the stage that retired it, the statistical reason, and what $100k would have become versus an S&P index fund over the same window.

## How verdicts are produced
Six stages, run nightly and unattended: hypothesis extraction from new research papers → feature engineering (point-in-time, cross-sectionally standardized) → 20-year backtests net of costs → statistical validation (Newey-West t-statistics, 10,000-draw block bootstrap, in-sample/out-of-sample degradation limits) → 3-state HMM regime audit → Fama-French-5 + Carhart factor decomposition. A strategy must survive every stage. Retired ideas publish on a 3-day lag; survivors are withheld.

## Honesty constraints
- The test universe is survivorship-biased (current large caps) — raw Sharpes are upper bounds, which makes retirements *more* credible and any survivor *less*.
- Retirement means the claim failed as specified here, net of assumed costs — not that the source is wrong in every setting.
- Educational research only; nothing here is investment advice. See the site footer for full disclaimers.

This repository hosts the generated static site. The research pipeline itself is private.
