"use client"

import type React from "react"

import { useState } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { getOrCreateAssociatedTokenAccount, getMint, mintTo } from "@solana/spl-token"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function MintToken() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const [mintAddress, setMintAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint tokens",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Validate mint address
      const mintPublicKey = new PublicKey(mintAddress)

      // Get mint info to determine decimals
      const mintInfo = await getMint(connection, mintPublicKey)

      // Calculate the amount to mint based on decimals
      const amountToMint = Math.floor(Number.parseFloat(amount) * Math.pow(10, mintInfo.decimals))

      toast({
        title: "Minting tokens",
        description: "Please approve the transaction in your wallet",
      })

      // Get or create the associated token account for the recipient
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
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
        mintPublicKey,
        publicKey,
      )

      // Mint tokens to the recipient's token account
      const signature = await mintTo(
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
        mintPublicKey,
        tokenAccount.address,
        publicKey,
        BigInt(amountToMint),
      )

      setTxSignature(signature)

      toast({
        title: "Tokens minted successfully",
        description: `${amount} tokens have been minted to your wallet`,
      })

      // Reset form
      setAmount("")
    } catch (error) {
      console.error("Error minting tokens:", error)
      toast({
        title: "Error minting tokens",
        description: "There was an error minting your tokens. Please check the mint address and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mint Tokens</CardTitle>
        <CardDescription>Mint new tokens to your wallet using an existing token mint</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMintToken} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="mintAddress">Token Mint Address</Label>
            <Input
              id="mintAddress"
              placeholder="Enter the token mint address"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">The mint address of the token you want to mint</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              min="0"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting Tokens...
              </>
            ) : (
              "Mint Tokens"
            )}
          </Button>
        </form>
      </CardContent>

      {txSignature && (
        <CardFooter className="flex flex-col items-start border-t pt-6">
          <h3 className="font-medium mb-2">Transaction Successful!</h3>
          <div className="bg-muted p-3 rounded-md w-full overflow-x-auto">
            <p className="text-xs font-mono break-all">{txSignature}</p>
          </div>
          <Button
            variant="link"
            className="p-0 h-auto mt-2"
            onClick={() => window.open(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`, "_blank")}
          >
            View on Solana Explorer
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

