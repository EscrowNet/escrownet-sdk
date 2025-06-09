import {
    Account,
    Contract,
    Provider,
    constants,
    stark,
    uint256,
} from "starknet";
import { hash } from "starknet";

// Custom error types
export class EscrowNetError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EscrowNetError";
    }
}

export class ValidationError extends EscrowNetError {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class TransactionError extends EscrowNetError {
    constructor(message: string) {
        super(message);
        this.name = "TransactionError";
    }
}

// Types for the SDK
export interface EscrowParams {
    recipient: string;
    amount: bigint;
    description: string;
}

export interface EscrowNetSDKConfig {
    provider: Provider;
    account: Account;
}

export class EscrowNetSDK {
    private readonly contract: Contract;
    private readonly account: Account;
    private readonly provider: Provider;

    // Contract address
    private static readonly CONTRACT_ADDRESS =
        "0x188167902e1e0bdc56e32fa394ba3446a4a6cd3768536425f8dd50f5d20a8ca";

    // Validation constants
    private static readonly MIN_USERNAME_LENGTH = 3;
    private static readonly MAX_USERNAME_LENGTH = 32;
    private static readonly MIN_DESCRIPTION_LENGTH = 1;
    private static readonly MAX_DESCRIPTION_LENGTH = 200;

    constructor(config: EscrowNetSDKConfig) {
        if (!config.provider) {
            throw new ValidationError("Provider is required");
        }
        if (!config.account) {
            throw new ValidationError("Account is required");
        }

        this.account = config.account;
        this.provider = config.provider;

        // Initialize the contract
        this.contract = new Contract(
            [
                // ABI for the contract methods
                {
                    name: "register_user",
                    type: "function",
                    inputs: [{ name: "username", type: "felt" }],
                    outputs: [],
                },
                {
                    name: "create_escrow",
                    type: "function",
                    inputs: [
                        { name: "recipient", type: "felt" },
                        { name: "amount", type: "Uint256" },
                        { name: "description", type: "felt" },
                    ],
                    outputs: [{ name: "escrow_id", type: "felt" }],
                },
                {
                    name: "release_funds",
                    type: "function",
                    inputs: [{ name: "escrow_id", type: "felt" }],
                    outputs: [],
                },
                {
                    name: "cancel_escrow",
                    type: "function",
                    inputs: [{ name: "escrow_id", type: "felt" }],
                    outputs: [],
                },
            ],
            EscrowNetSDK.CONTRACT_ADDRESS,
            this.provider
        );
        this.contract.connect(this.account);
    }

    /**
     * Validates a username
     * @param username The username to validate
     * @throws ValidationError if the username is invalid
     */
    private validateUsername(username: string): void {
        if (!username || typeof username !== "string") {
            throw new ValidationError("Username must be a non-empty string");
        }
        if (username.length < EscrowNetSDK.MIN_USERNAME_LENGTH) {
            throw new ValidationError(
                `Username must be at least ${EscrowNetSDK.MIN_USERNAME_LENGTH} characters long`
            );
        }
        if (username.length > EscrowNetSDK.MAX_USERNAME_LENGTH) {
            throw new ValidationError(
                `Username must not exceed ${EscrowNetSDK.MAX_USERNAME_LENGTH} characters`
            );
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError(
                "Username can only contain letters, numbers, underscores, and hyphens"
            );
        }
    }

    /**
     * Validates escrow parameters
     * @param params The parameters to validate
     * @throws ValidationError if any parameter is invalid
     */
    private validateEscrowParams(params: EscrowParams): void {
        if (!params.recipient || typeof params.recipient !== "string") {
            throw new ValidationError("Recipient address is required");
        }
        if (!params.amount || params.amount <= BigInt(0)) {
            throw new ValidationError("Amount must be greater than 0");
        }
        if (!params.description || typeof params.description !== "string") {
            throw new ValidationError("Description is required");
        }
        if (params.description.length < EscrowNetSDK.MIN_DESCRIPTION_LENGTH) {
            throw new ValidationError("Description cannot be empty");
        }
        if (params.description.length > EscrowNetSDK.MAX_DESCRIPTION_LENGTH) {
            throw new ValidationError(
                `Description must not exceed ${EscrowNetSDK.MAX_DESCRIPTION_LENGTH} characters`
            );
        }
    }

    /**
     * Safely executes a transaction with proper error handling
     * @param transactionFn The transaction function to execute
     * @param errorMessage The error message to use if the transaction fails
     * @returns The transaction result
     */
    private async executeTransaction<T>(
        transactionFn: () => Promise<T>,
        errorMessage: string
    ): Promise<T> {
        try {
            return await transactionFn();
        } catch (error: any) {
            if (error instanceof EscrowNetError) {
                throw error;
            }

            // Handle specific StarkNet errors
            if (error.message?.includes("insufficient funds")) {
                throw new TransactionError(
                    "Insufficient funds to complete the transaction"
                );
            }
            if (error.message?.includes("nonce")) {
                throw new TransactionError("Invalid nonce. Please try again");
            }
            if (error.message?.includes("gas")) {
                throw new TransactionError(
                    "Insufficient gas to complete the transaction"
                );
            }

            throw new TransactionError(
                `${errorMessage}: ${error?.message || "Unknown error"}`
            );
        }
    }

    /**
     * Register a new user with the provided username
     * @param username The username to register
     * @returns Promise that resolves when the transaction is complete
     */
    async registerUser(username: string): Promise<void> {
        this.validateUsername(username);

        await this.executeTransaction(async () => {
            const tx = await this.contract.register_user(
                hash.computeHashOnElements([username]).toString()
            );
            await this.provider.waitForTransaction(tx.transaction_hash);
        }, "Failed to register user");
    }

    /**
     * Create a new escrow contract
     * @param params The parameters for creating the escrow
     * @returns Promise that resolves with the escrow ID
     */
    async createEscrow(params: EscrowParams): Promise<string> {
        this.validateEscrowParams(params);

        return await this.executeTransaction(async () => {
            const amountUint256 = uint256.bnToUint256(params.amount);
            const tx = await this.contract.create_escrow(
                params.recipient,
                amountUint256,
                hash.computeHashOnElements([params.description]).toString()
            );
            await this.provider.waitForTransaction(tx.transaction_hash);

            const receipt = await this.provider.getTransactionReceipt(
                tx.transaction_hash
            );

            // Type guard to check if the receipt is a successful transaction
            if (
                "status" in receipt &&
                (receipt.status === "ACCEPTED_ON_L2" ||
                    receipt.status === "ACCEPTED_ON_L1")
            ) {
                const events = (receipt as any).events;
                if (!events?.[0]?.data?.[0]) {
                    throw new TransactionError(
                        "Failed to get escrow ID from transaction receipt"
                    );
                }
                return events[0].data[0];
            } else {
                throw new TransactionError(
                    `Transaction was not accepted. Status: ${
                        receipt.status || "unknown"
                    }`
                );
            }
        }, "Failed to create escrow");
    }

    /**
     * Release funds to the recipient for a specific escrow
     * @param escrowId The ID of the escrow to release funds from
     * @returns Promise that resolves when the transaction is complete
     */
    async releaseFunds(escrowId: string): Promise<void> {
        if (!escrowId || typeof escrowId !== "string") {
            throw new ValidationError("Valid escrow ID is required");
        }

        await this.executeTransaction(async () => {
            const tx = await this.contract.release_funds(escrowId);
            await this.provider.waitForTransaction(tx.transaction_hash);
        }, "Failed to release funds");
    }

    /**
     * Cancel an escrow contract
     * @param escrowId The ID of the escrow to cancel
     * @returns Promise that resolves when the transaction is complete
     */
    async cancelEscrow(escrowId: string): Promise<void> {
        if (!escrowId || typeof escrowId !== "string") {
            throw new ValidationError("Valid escrow ID is required");
        }

        await this.executeTransaction(async () => {
            const tx = await this.contract.cancel_escrow(escrowId);
            await this.provider.waitForTransaction(tx.transaction_hash);
        }, "Failed to cancel escrow");
    }
}
