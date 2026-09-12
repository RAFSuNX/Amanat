"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs px-4 py-2 rounded border border-border hover:bg-muted transition-colors"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      Download / Print PDF
    </button>
  )
}
