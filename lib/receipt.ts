export function receiptNumber(id: number, date: Date): string {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "")
  return `AMT-${d}-${String(id).padStart(5, "0")}`
}
