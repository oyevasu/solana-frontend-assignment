"use client"

import { useEffect, useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import type { ConfirmedSignatureInfo } from "@solana/web3.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function TransactionHistory() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [transactions, setTransactions] = useState<ConfirmedSignatureInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicKey) return

      try {
        setLoading(true)

        // Get recent transactions for this wallet
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 })

        setTransactions(signatures)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [publicKey, connection])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const openExplorer = (signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.signature} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <div className="overflow-hidden">
                  <div className="font-medium truncate">
                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.blockTime ? formatDate(tx.blockTime) : "Pending"}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openExplorer(tx.signature)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No recent transactions found</div>
        )}
      </CardContent>
    </Card>
  )
}

