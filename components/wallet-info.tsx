"use client"

import { useEffect, useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function WalletInfo() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return

      try {
        setLoading(true)
        const bal = await connection.getBalance(publicKey)
        setBalance(bal / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error("Error fetching balance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Set up interval to refresh balance
    const intervalId = setInterval(fetchBalance, 15000)

    return () => clearInterval(intervalId)
  }, [publicKey, connection])

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, "_blank")
    }
  }

  const requestAirdrop = async () => {
    if (!publicKey) return

    try {
      toast({
        title: "Requesting airdrop",
        description: "Requesting 1 SOL from devnet faucet...",
      })

      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL)
      await connection.confirmTransaction(signature)

      // Refresh balance
      const newBalance = await connection.getBalance(publicKey)
      setBalance(newBalance / LAMPORTS_PER_SOL)

      toast({
        title: "Airdrop successful",
        description: "1 SOL has been added to your wallet",
      })
    } catch (error) {
      console.error("Error requesting airdrop:", error)
      toast({
        title: "Airdrop failed",
        description: "Failed to request SOL from devnet faucet",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Wallet Info</span>
          <Button variant="outline" size="sm" onClick={requestAirdrop}>
            Request Airdrop
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Address</h3>
            {publicKey ? (
              <div className="flex items-center gap-2">
                <code className="bg-muted p-2 rounded text-xs md:text-sm w-full overflow-x-auto">
                  {publicKey.toString()}
                </code>
                <Button variant="ghost" size="icon" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={openExplorer}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Skeleton className="h-8 w-full" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">SOL Balance</h3>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{balance !== null ? balance.toFixed(4) : "0"} SOL</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

