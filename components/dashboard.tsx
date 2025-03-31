"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletInfo } from "@/components/wallet-info"
import { CreateToken } from "@/components/create-token"
import { MintToken } from "@/components/mint-token"
import { SendToken } from "@/components/send-token"
import { TransactionHistory } from "@/components/transaction-history"
import { TokenBalances } from "@/components/token-balances"
import { WalletConnectionGuide } from "@/components/wallet-connection-guide"

export function Dashboard() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Solana Token Manager</h1>
        <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
      </div>

      {!connected ? (
        <div className="flex flex-col items-center justify-center py-12">
          <WalletConnectionGuide />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 md:w-[600px] mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create">Create Token</TabsTrigger>
            <TabsTrigger value="mint">Mint Token</TabsTrigger>
            <TabsTrigger value="send">Send Token</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WalletInfo />
              <TokenBalances />
            </div>
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="create">
            <CreateToken />
          </TabsContent>

          <TabsContent value="mint">
            <MintToken />
          </TabsContent>

          <TabsContent value="send">
            <SendToken />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

