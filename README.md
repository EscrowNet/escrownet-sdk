# EscrowNet SDK

The **EscrowNet SDK** is a JavaScript/TypeScript library that enables developers to integrate secure escrow functionality into their applications on [Starknet](https://starknet.io/), a Layer 2 scaling solution for Ethereum. The SDK provides a simple and secure interface for interacting with EscrowNet’s smart contracts, supporting features like user registration, escrow creation, and fund management. Built with Starknet’s native Account Abstraction (AA) and session-based authentication, it simplifies complex blockchain interactions for developers building decentralized applications (dApps).

## Features
- **User Registration**: Register users with unique usernames (e.g., `otaiki`) on the EscrowNet contract.
- **Escrow Management**: Create, release, and cancel escrow contracts with customizable terms.
- **Dynamic Gas Estimation**: Automatically handle Starknet’s `l1_gas` and `l1_data_gas` fees to prevent transaction failures.
- **Session-Based Authentication**: Use session tokens for seamless transaction signing, reducing user friction.
- **Wallet Compatibility**: Supports Starknet wallets like Argent X and Braavos.
- **TypeScript Support**: Fully typed APIs for modern JavaScript/TypeScript development.

## Installation
Install the EscrowNet SDK via npm:

