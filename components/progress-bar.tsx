"use client"

import { AppProgressBar } from "next-nprogress-bar"

export function ProgressBar() {
  return (
    <AppProgressBar
      height="2px"
      color="oklch(0.40 0.11 155)"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
