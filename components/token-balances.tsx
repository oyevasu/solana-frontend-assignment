"use client"

import { useEffect, useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TokenAccount {
  mint: string
  amount: string
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
}

export function TokenBalances() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTokenAccounts = async () => {
      if (!publicKey) return

      try {
        setLoading(true)

        // Get all token accounts for this wallet
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })

        // Format the data
        const tokens = accounts.value.map((account) => {
          const parsedInfo = account.account.data.parsed.info
          const mintAddress = parsedInfo.mint
          const tokenAmount = parsedInfo.tokenAmount

          return {
            mint: mintAddress,
            amount: tokenAmount.amount,
            decimals: tokenAmount.decimals,
            uiAmount: tokenAmount.uiAmount,
            // We could fetch token metadata here if needed
          }
        })

        setTokenAccounts(tokens)
      } catch (error) {
        console.error("Error fetching token accounts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenAccounts()

    // Set up interval to refresh token balances
    const intervalId = setInterval(fetchTokenAccounts, 15000)

    return () => clearInterval(intervalId)
  }, [publicKey, connection])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tokenAccounts.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {tokenAccounts.map((token) => (
                <div key={token.mint} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{token.uiAmount}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                    </div>
                  </div>
                  <Badge variant="outline">SPL Token</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No tokens found in this wallet</div>
        )}
      </CardContent>
    </Card>
  )
}

