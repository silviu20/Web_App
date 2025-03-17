/*
This client component provides the providers for the app.
*/

"use client"

import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
  attribute: string
  defaultTheme: string
  enableSystem: boolean
  disableTransitionOnChange: boolean
}

export function Providers({
  children,
  attribute,
  defaultTheme,
  enableSystem,
  disableTransitionOnChange
}: ProvidersProps) {
  return (
    <ThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </ThemeProvider>
  )
}
