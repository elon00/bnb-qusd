# Security Policy

## Project status

BNB-QUSD is a testnet-oriented stablecoin, PQC-gateway and portfolio-research prototype. It is not represented as independently audited, mainnet-live, market-proven, or production-certified financial infrastructure.

## Reporting a vulnerability

Please avoid publishing exploitable details in a public issue before a fix is available.

Use GitHub private vulnerability reporting / a Security Advisory when available. Include:

- affected commit and component;
- reproduction steps or a minimal proof of concept;
- realistic impact and attack preconditions;
- whether keys, funds, oracle inputs, governance, collateral accounting or external integrations may be affected;
- suggested remediation if known.

If private reporting is unavailable, open a minimal public issue requesting a private disclosure channel without including exploit details.

## Secrets and funds

Never commit or paste into issues:

- private keys, mnemonics or wallet recovery material;
- RPC/provider API keys;
- exchange/router credentials;
- production oracle secrets;
- deployment or governance signing keys.

Use dedicated testnet accounts for development and managed/hardware-backed custody for any higher-risk deployment.

## Current security boundary

Repository tests cover selected CDP, liquidation, timelock, PQC gateway, adversarial/fuzz and reality invariants. These automated checks are engineering evidence only.

They do not replace:

- independent smart-contract audit;
- economic/oracle manipulation review;
- liquidation stress testing;
- key-custody review;
- mainnet deployment review;
- legal/regulatory assessment for stablecoin issuance or financial services.

## Financial and market claims

A local or testnet invariant does not prove a stable peg, solvency, sustained liquidity, market adoption, or investment safety.

Do not describe BNB-QUSD as audited, insured, fully backed, production-ready, mainnet-live, or market-proven without independent evidence supporting the exact statement.

## CI expectations

Maintained changes should pass:

- locked dependency installation;
- high/critical production dependency audit;
- Solidity compilation;
- core, PQC, fuzz and timelock tests;
- repository security scan;
- reality/evidence gates.
