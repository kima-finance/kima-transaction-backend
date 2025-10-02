# Release Log

## 1.5.7

### Overview

- Fix: wrong decimals number used in amountOut for swap transaction

## v1.5.6

### Overview

- New: Support for USD1 (only as a target token) on Ethereum and Solana

### Added

- New chain token USD1 as target in Ethereum and Solana.

## v1.5.x

### Overview

- New: Bank transfers (FIAT rails) fully supported and unified with Credit Card handling.
- New: On-chain Swap flow (end-to-end) via new submit endpoint.
- Stricter FIAT contract: FIAT flows now require a transactionIdSeed (UUIDv4) and a derived transactionIdSignature.
- Naming change: fee/options naming aligned to camelCase (payment_method → paymentMethod).
- Stability fixes across Solana RPC usage and payload validation.
- Internals: large feature-based refactor (no route renames, but code layout changed).

### Added

- New endpoint: POST /submit/swap (amountIn/amountOut as bigint strings, decimals, dex, slippage, options).
- FIAT rails normalization: treat originChain: 'BANK' | 'CC' as FIAT during submit.
- FIAT signing data: require transactionIdSeed (UUIDv4). Backend derives and injects transactionIdSignature into options.
- Helper: /submit/transactionId?transactionIdSeed=<uuid> (optional helper to fetch encoded ID used by CC flows).
- Feature modules: split into submit, fees, reclaim, htlc, btc, kyc, compliance, chains, shared, etc.

### Changed

- Options naming: payment_method → paymentMethod (camelCase) inside stringified options.
- Validation: tighter FIAT address validation; clear originAddress for BANK/CC in payload; consistent BTC/testnet endpoints; safer CORS/domain parsing.

### Breaking

- FIAT required fields: You must supply fiatTransactionIdSeed (or options.transactionIdSeed) for BANK/CC/FIAT origins. Missing → 400 or chain rejection.
- Options casing: switch to paymentMethod in options (keep feeId from fee estimator).
- Options must be a JSON string at submit time.

### Upgrade checklist

- Deploy backend at 1.5.5.
- In transfer submits:
- Normalize: originChain 'BANK'|'CC' → 'FIAT', originAddress → "".
- Ensure options is a string with: { feeId, paymentMethod, transactionIdSeed, transactionIdSignature }.
- Remove crypto approval signature from options for FIAT.
- Implement/enable POST /submit/swap if you need swaps.

## 1.4.x

### Overview

- Credit cards introduced as an origin network (on-ramp).
- Mandatory message signing of transaction details (light-mode approvals).
- Fee estimator required before submit; returns a feeId to forward to /submit.

### Added

- Fee estimator endpoint consumption; submit must include returned feeId.
- Signature capture: submit payload includes user’s approval signature (for crypto flows).

### Changed

- ENV updates (see .env.example):
- PAYMENT_PARTNER_ID (Mainnet: Kima, Sardis Testnet: KimaTest)
- KIMA_BACKEND_FEE_URL
- Mainnet: https://fcs.kima.network
- Sardis Testnet: https://fcs.sardis.kima.network
- Chain filtering: via KIMA_CHAIN_FILTER (replaces widget-side exclude props).

### Breaking

- Submits without feeId or without signature (crypto flows) are rejected.
- Backend alone cannot process CC (requires widget).

### Upgrade checklist

- Set new envs (PAYMENT_PARTNER_ID, KIMA_BACKEND_FEE_URL).
- Ensure fee estimator is called before submit; pass feeId in options.
- Include user’s approval signature for crypto transfer submits.
