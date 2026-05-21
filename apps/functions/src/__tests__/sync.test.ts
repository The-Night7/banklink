import { describe, expect, it } from "vitest";

import { buildCsvTransactionDocument, buildTransactionDocument } from "../services/transaction-documents";

describe("sync service helpers", () => {
  it("builds a provider transaction document with normalized values", () => {
    const document = buildTransactionDocument({
      userId: "user-1",
      connectionId: "conn-1",
      accountId: "account-1",
      providerTransaction: {
        externalId: "tx-1",
        accountExternalId: "account-1",
        bookedAt: "2025-01-02T00:00:00.000Z",
        date: "2025-01-02T00:00:00.000Z",
        amount: -18.5,
        currency: "EUR",
        label: "CB MONOPRIX",
        merchantName: "Monoprix",
        providerCategory: "groceries"
      },
      merchantRules: []
    });

    expect(document.categoryId).toBe("food");
    expect(document.normalizedLabel).toBe("cb monoprix");
    expect(document.flags.needsReview).toBe(false);
  });

  it("builds a csv transaction document using the same categorization pipeline", () => {
    const document = buildCsvTransactionDocument({
      userId: "user-1",
      accountId: "csv-main",
      label: "Salaire",
      amount: 2400,
      date: "2025-01-29T00:00:00.000Z",
      merchantRules: []
    });

    expect(document.source).toBe("csv");
    expect(document.categoryId).toBe("income");
    expect(document.flags.isInternalTransfer).toBe(false);
  });
});
