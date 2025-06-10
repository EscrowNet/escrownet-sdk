# EscrowNet SDK

A TypeScript SDK for interacting with the EscrowNet smart contract on StarkNet.

## Installation

```bash
npm install escrownet-sdk
```

## Usage

```typescript
import { EscrowNetSDK, Provider, Account } from "escrownet-sdk";
import { RpcProvider } from "starknet";

// Initialize the provider and account
const provider = new RpcProvider({ nodeUrl: "YOUR_STARKNET_NODE_URL" });
const account = new Account(
    provider,
    "YOUR_ACCOUNT_ADDRESS",
    "YOUR_PRIVATE_KEY"
);

// Create SDK instance
const sdk = new EscrowNetSDK({
    provider,
    account,
});

// Register a user
await sdk.registerUser("username");

// Create an escrow
const escrowId = await sdk.createEscrow({
    recipient: "RECIPIENT_ADDRESS",
    amount: BigInt(1000000000000000000), // 1 ETH in wei
    description: "Payment for services",
});

// Release funds
await sdk.releaseFunds(escrowId);

// Cancel escrow
await sdk.cancelEscrow(escrowId);
```

## Features

### Dynamic Gas Estimation

The SDK automatically handles gas estimation for all transactions using StarkNet's `starknet_estimateFee` RPC call. This ensures that:

- Gas prices are dynamically calculated based on current network conditions
- A 20% buffer is added to estimated gas to account for fluctuations
- Transactions are less likely to fail due to insufficient gas
- Gas costs are optimized for current network conditions

The gas estimation is transparent to the user and requires no additional configuration.

## API Reference

### EscrowNetSDK

The main class for interacting with the EscrowNet contract.

#### Constructor

```typescript
constructor(config: EscrowNetSDKConfig)
```

Parameters:

- `config`: Configuration object containing:
    - `provider`: StarkNet provider instance
    - `account`: StarkNet account instance

#### Methods

##### registerUser

```typescript
async registerUser(username: string): Promise<void>
```

Registers a new user with the provided username.

Parameters:

- `username`: The username to register

##### createEscrow

```typescript
async createEscrow(params: EscrowParams): Promise<string>
```

Creates a new escrow contract.

Parameters:

- `params`: Object containing:
    - `recipient`: The recipient's address
    - `amount`: The amount to escrow (in wei)
    - `description`: Description of the escrow

Returns:

- `Promise<string>`: The escrow ID

##### releaseFunds

```typescript
async releaseFunds(escrowId: string): Promise<void>
```

Releases funds to the recipient for a specific escrow.

Parameters:

- `escrowId`: The ID of the escrow to release funds from

##### cancelEscrow

```typescript
async cancelEscrow(escrowId: string): Promise<void>
```

Cancels an escrow contract.

Parameters:

- `escrowId`: The ID of the escrow to cancel

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT
