import { Account, Contract, Provider, constants, stark, uint256 } from 'starknet';

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
    private static readonly CONTRACT_ADDRESS = '0x188167902e1e0bdc56e32fa394ba3446a4a6cd3768536425f8dd50f5d20a8ca';

    constructor(config: EscrowNetSDKConfig) {
        this.account = config.account;
        this.provider = config.provider;
        
        // Initialize the contract
        this.contract = new Contract(
            [
                // ABI for the contract methods
                {
                    name: 'register_user',
                    type: 'function',
                    inputs: [{ name: 'username', type: 'felt' }],
                    outputs: []
                },
                {
                    name: 'create_escrow',
                    type: 'function',
                    inputs: [
                        { name: 'recipient', type: 'felt' },
                        { name: 'amount', type: 'Uint256' },
                        { name: 'description', type: 'felt' }
                    ],
                    outputs: [{ name: 'escrow_id', type: 'felt' }]
                },
                {
                    name: 'release_funds',
                    type: 'function',
                    inputs: [{ name: 'escrow_id', type: 'felt' }],
                    outputs: []
                },
                {
                    name: 'cancel_escrow',
                    type: 'function',
                    inputs: [{ name: 'escrow_id', type: 'felt' }],
                    outputs: []
                }
            ],
            EscrowNetSDK.CONTRACT_ADDRESS,
            this.provider
        );
        this.contract.connect(this.account);
    }

    /**
     * Register a new user with the provided username
     * @param username The username to register
     * @returns Promise that resolves when the transaction is complete
     */
    async registerUser(username: string): Promise<void> {
        try {
            const tx = await this.contract.register_user(
                stark.starknetKeccak(username).toString()
            );
            await this.provider.waitForTransaction(tx.transaction_hash);
        } catch (error: any) {
            throw new Error(`Failed to register user: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Create a new escrow contract
     * @param params The parameters for creating the escrow
     * @returns Promise that resolves with the escrow ID
     */
    async createEscrow(params: EscrowParams): Promise<string> {
        try {
            const amountUint256 = uint256.bnToUint256(params.amount);
            const tx = await this.contract.create_escrow(
                params.recipient,
                amountUint256,
                stark.starknetKeccak(params.description).toString()
            );
            await this.provider.waitForTransaction(tx.transaction_hash);
            
            // Get the escrow ID from the transaction receipt
            const receipt = await this.provider.getTransactionReceipt(tx.transaction_hash);
            return receipt.events[0].data[0]; // Assuming the first event data contains the escrow ID
        } catch (error: any) {
            throw new Error(`Failed to create escrow: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Release funds to the recipient for a specific escrow
     * @param escrowId The ID of the escrow to release funds from
     * @returns Promise that resolves when the transaction is complete
     */
    async releaseFunds(escrowId: string): Promise<void> {
        try {
            const tx = await this.contract.release_funds(escrowId);
            await this.provider.waitForTransaction(tx.transaction_hash);
        } catch (error: any) {
            throw new Error(`Failed to release funds: ${error?.message || 'Unknown error'}`);
        }
    }

    /**
     * Cancel an escrow contract
     * @param escrowId The ID of the escrow to cancel
     * @returns Promise that resolves when the transaction is complete
     */
    async cancelEscrow(escrowId: string): Promise<void> {
        try {
            const tx = await this.contract.cancel_escrow(escrowId);
            await this.provider.waitForTransaction(tx.transaction_hash);
        } catch (error: any) {
            throw new Error(`Failed to cancel escrow: ${error?.message || 'Unknown error'}`);
        }
    }
} 