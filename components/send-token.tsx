"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, transferChecked, getMint } from "@solana/spl-token"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface TokenAccount {
  mint: string
  amount: string
  decimals: number
  uiAmount: number
}

export function SendToken() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([])
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  useEffect(() => {
    const fetchTokenAccounts = async () => {
      if (!publicKey) return

      try {
        // Get all token accounts for this wallet
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })

        // Format the data
        const tokens = accounts.value
          .map((account) => {
            const parsedInfo = account.account.data.parsed.info
            const mintAddress = parsedInfo.mint
            const tokenAmount = parsedInfo.tokenAmount

            return {
              mint: mintAddress,
              amount: tokenAmount.amount,
              decimals: tokenAmount.decimals,
              uiAmount: tokenAmount.uiAmount,
            }
          })
          .filter((token) => Number.parseInt(token.amount) > 0)

        setTokenAccounts(tokens)
      } catch (error) {
        console.error("Error fetching token accounts:", error)
      }
    }

    fetchTokenAccounts()
  }, [publicKey, connection])

  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to send tokens",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Validate recipient address
      const recipientPublicKey = new PublicKey(recipientAddress)

      // Validate selected token
      if (!selectedToken) {
        throw new Error("Please select a token to send")
      }

      const mintPublicKey = new PublicKey(selectedToken)

      // Get mint info to determine decimals
      const mintInfo = await getMint(connection, mintPublicKey)

      // Calculate the amount to send based on decimals
      const amountToSend = Math.floor(Number.parseFloat(amount) * Math.pow(10, mintInfo.decimals))

      toast({
        title: "Sending tokens",
        description: "Please approve the transaction in your wallet",
      })

      // Get the source token account
      const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
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

      // Get or create the destination token account
      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
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
        recipientPublicKey,
      )

      // Send tokens
      const signature = await transferChecked(
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
        sourceTokenAccount.address,
        mintPublicKey,
        destinationTokenAccount.address,
        publicKey,
        BigInt(amountToSend),
        mintInfo.decimals,
      )

      setTxSignature(signature)

      toast({
        title: "Tokens sent successfully",
        description: `${amount} tokens have been sent to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}`,
      })

      // Reset form
      setAmount("")
      setRecipientAddress("")
    } catch (error) {
      console.error("Error sending tokens:", error)
      toast({
        title: "Error sending tokens",
        description: "There was an error sending your tokens. Please check the recipient address and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Tokens</CardTitle>
        <CardDescription>Send tokens from your wallet to another address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendToken} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="tokenSelect">Select Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger id="tokenSelect">
                <SelectValue placeholder="Select a token" />
              </SelectTrigger>
              <SelectContent>
                {tokenAccounts.length > 0 ? (
                  tokenAccounts.map((token) => (
                    <SelectItem key={token.mint} value={token.mint}>
                      {token.uiAmount} - {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-tokens" disabled>
                    No tokens available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipientAddress">Recipient Address</Label>
            <Input
              id="recipientAddress"
              placeholder="Enter the recipient's Solana address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
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

          <Button type="submit" className="w-full" disabled={loading || tokenAccounts.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Tokens...
              </>
            ) : (
              "Send Tokens"
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

