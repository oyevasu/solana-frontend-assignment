"use client"

import type React from "react"

import { useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Keypair } from "@solana/web3.js"
import { createMint } from "@solana/spl-token"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function CreateToken() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [decimals, setDecimals] = useState("9")
  const [loading, setLoading] = useState(false)
  const [createdTokenMint, setCreatedTokenMint] = useState<string | null>(null)

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Create a new mint account
      const mintKeypair = Keypair.generate()

      toast({
        title: "Creating token",
        description: "Please approve the transaction in your wallet",
      })

      // Create the token with the specified decimals
      const mintAddress = await createMint(
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions: async (txs) => {
            return Promise.all(txs.map((tx) => signTransaction(tx)))
          },
          sendTransaction: async (tx, conn, opts) => {
            const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash()
            tx.recentBlockhash = blockhash
            tx.feePayer = publicKey

            const signed = await signTransaction(tx)
            const txid = await conn.sendRawTransaction(signed.serialize(), opts)
            return txid
          },
        },
        mintKeypair,
        publicKey,
        publicKey,
        Number.parseInt(decimals),
      )

      setCreatedTokenMint(mintAddress.toString())

      toast({
        title: "Token created successfully",
        description: `Your new token has been created with mint address: ${mintAddress.toString().slice(0, 8)}...${mintAddress.toString().slice(-8)}`,
      })

      // Reset form
      setTokenName("")
      setTokenSymbol("")
      setDecimals("9")
    } catch (error) {
      console.error("Error creating token:", error)
      toast({
        title: "Error creating token",
        description: "There was an error creating your token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Token</CardTitle>
        <CardDescription>Create your own SPL token on the Solana devnet</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="tokenName">Token Name</Label>
            <Input
              id="tokenName"
              placeholder="My Token"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tokenSymbol">Token Symbol</Label>
            <Input
              id="tokenSymbol"
              placeholder="TKN"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="decimals">Decimals</Label>
            <Input
              id="decimals"
              type="number"
              min="0"
              max="9"
              placeholder="9"
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of decimal places (0-9). Standard is 9 for most tokens.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Token...
              </>
            ) : (
              "Create Token"
            )}
          </Button>
        </form>
      </CardContent>

      {createdTokenMint && (
        <CardFooter className="flex flex-col items-start border-t pt-6">
          <h3 className="font-medium mb-2">Token Created Successfully!</h3>
          <div className="bg-muted p-3 rounded-md w-full overflow-x-auto">
            <p className="text-xs font-mono break-all">{createdTokenMint}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Save this mint address to use for minting tokens.</p>
        </CardFooter>
      )}
    </Card>
  )
}

