import { Provider, Transaction } from "starknet";

export interface GasEstimate {
    l1_gas: {
        max_amount: string;
        max_price_per_unit: string;
    };
    l1_data_gas: {
        max_amount: string;
        max_price_per_unit: string;
    };
    l2_gas: {
        max_amount: string;
        max_price_per_unit: string;
    };
}

/**
 * Estimates gas fees for a transaction using starknet_estimateFee
 * @param provider The StarkNet provider instance
 * @param transaction The transaction to estimate fees for
 * @returns Promise resolving to gas estimates
 */
export async function estimateFees(
    provider: Provider,
    transaction: Transaction
): Promise<GasEstimate> {
    try {
        const feeEstimate = await provider.estimateFee(
            [
                {
                    ...transaction,
                    resource_bounds: {
                        l1_gas: {
                            max_amount: "0x1000",
                            max_price_per_unit: "0x0",
                        },
                        l1_data_gas: {
                            max_amount: "0x1000",
                            max_price_per_unit: "0x0",
                        },
                        l2_gas: {
                            max_amount: "0x0",
                            max_price_per_unit: "0x0",
                        },
                    },
                },
            ],
            { block_id: "pending" }
        );

        // Add a 20% buffer to the estimated fees to account for fluctuations
        const bufferMultiplier = 1.2;

        return {
            l1_gas: {
                max_amount: Math.ceil(
                    Number(feeEstimate[0].overall_fee.l1_gas) * bufferMultiplier
                ).toString(16),
                max_price_per_unit: "0x0",
            },
            l1_data_gas: {
                max_amount: Math.ceil(
                    Number(feeEstimate[0].overall_fee.l1_data_gas) *
                        bufferMultiplier
                ).toString(16),
                max_price_per_unit: "0x0",
            },
            l2_gas: {
                max_amount: "0x0",
                max_price_per_unit: "0x0",
            },
        };
    } catch (error: any) {
        throw new Error(`Failed to estimate gas fees: ${error.message}`);
    }
}
