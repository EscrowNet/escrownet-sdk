import { Provider, Transaction } from "starknet";
import { estimateFees } from "../../src/utils/gasEstimation";

// Mock the Provider class
jest.mock("starknet", () => ({
    Provider: jest.fn().mockImplementation(() => ({
        estimateFee: jest.fn().mockResolvedValue([
            {
                overall_fee: {
                    l1_gas: "1000",
                    l1_data_gas: "500",
                },
            },
        ]),
    })),
    Transaction: jest.fn(),
}));

describe("Gas Estimation", () => {
    let provider: Provider;
    let mockTransaction: Transaction;

    beforeEach(() => {
        provider = new Provider();
        mockTransaction = {
            type: "INVOKE",
            sender_address: "0x123",
            calldata: [],
            signature: [],
            nonce: "0x0",
            max_fee: "0x0",
            version: "0x1",
        } as Transaction;
    });

    it("should estimate gas fees with buffer", async () => {
        const estimate = await estimateFees(provider, mockTransaction);

        expect(estimate.l1_gas.max_amount).toBeDefined();
        expect(estimate.l1_data_gas.max_amount).toBeDefined();
        expect(estimate.l2_gas.max_amount).toBe("0x0");

        // Verify that the buffer was applied (20% increase)
        const l1GasAmount = parseInt(estimate.l1_gas.max_amount, 16);
        expect(l1GasAmount).toBeGreaterThanOrEqual(1200); // 1000 * 1.2

        const l1DataGasAmount = parseInt(estimate.l1_data_gas.max_amount, 16);
        expect(l1DataGasAmount).toBeGreaterThanOrEqual(600); // 500 * 1.2
    });

    it("should handle estimation errors", async () => {
        const mockError = new Error("Estimation failed");
        (provider.estimateFee as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(estimateFees(provider, mockTransaction)).rejects.toThrow(
            "Failed to estimate gas fees: Estimation failed"
        );
    });
});
