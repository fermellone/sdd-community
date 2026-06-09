"use client"

import { SignInButton as ClerkSignInButton } from "@clerk/nextjs"

export function SignInButton() {
  return (
    <ClerkSignInButton mode="modal">
      <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Iniciar sesión con Discord
      </button>
    </ClerkSignInButton>
  )
}
