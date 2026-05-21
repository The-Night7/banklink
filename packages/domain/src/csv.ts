import { stableTransactionHash } from "./aggregations";
import type { CsvColumnMapping, ParsedCsvRow } from "./types";

export const parseCsvRow = (
  row: Record<string, string>,
  mapping: CsvColumnMapping
): ParsedCsvRow => {
  const rawAmount = row[mapping.amount]?.replace(/\s/g, "").replace(",", ".") ?? "0";

  return {
    date: new Date(row[mapping.date]).toISOString(),
    amount: Number(rawAmount),
    label: row[mapping.label] ?? "",
    merchant: mapping.merchant ? row[mapping.merchant] : undefined,
    category: mapping.category ? row[mapping.category] : undefined
  };
};

export const buildCsvRowHash = (row: ParsedCsvRow) =>
  stableTransactionHash([row.date, `${row.amount}`, row.label, row.merchant ?? ""]);
