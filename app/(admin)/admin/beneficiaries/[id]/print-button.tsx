"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-muted-foreground hover:text-foreground border rounded px-3 py-1.5 transition-colors"
    >
      Print Record
    </button>
  )
}
