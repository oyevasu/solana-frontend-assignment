"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Steps, Step } from "@/components/ui/steps"
import { Button } from "@/components/ui/button"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { ExternalLink } from "lucide-react"

export function WalletConnectionGuide() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>Follow these steps to get started with Solana Token Manager</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Steps>
          <Step title="Install a Wallet">
            <p className="text-sm text-muted-foreground mb-2">Install a Solana wallet as a browser extension</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => window.open("https://phantom.app/", "_blank")}
              >
                <img src="/placeholder.svg?height=20&width=20" alt="Phantom" className="mr-2 h-5 w-5" />
                Phantom Wallet
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => window.open("https://solflare.com/", "_blank")}
              >
                <img src="/placeholder.svg?height=20&width=20" alt="Solflare" className="mr-2 h-5 w-5" />
                Solflare Wallet
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </Step>
          <Step title="Connect Your Wallet">
            <p className="text-sm text-muted-foreground mb-4">Click the button below and select your wallet</p>
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90 w-full" />
          </Step>
          <Step title="Switch to Devnet">
            <p className="text-sm text-muted-foreground">
              Open your wallet extension and switch to Devnet in the settings
            </p>
          </Step>
        </Steps>

        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium">Why connect a wallet?</p>
          <p className="text-muted-foreground mt-1">
            Connecting your wallet allows you to create, mint, and send Solana tokens on the devnet for testing
            purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

