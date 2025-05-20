"use client"

import { useState } from "react"
import { useAccount, useWalletClient } from "wagmi"
import { lensClient } from "@/lib/lens"
import { MetadataAttributeType, account } from "@lens-protocol/metadata"
import { storageClient } from "@/lib/storageClient"
import { uri } from "@lens-protocol/client"
import { createAccountWithUsername, fetchAccount } from "@lens-protocol/client/actions"
import { handleOperationWith } from "@lens-protocol/client/viem"
import { never } from "@lens-protocol/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    picture: "",
    coverPicture: "",
    tags: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !walletClient) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Authenticate as Onboarding User
      const authenticated = await lensClient.login({
        onboardingUser: {
          app: process.env.NEXT_PUBLIC_LENS_APP_ID,
          wallet: address,
        },
        signMessage: (message) => walletClient.signMessage({ message }),
      })

      if (authenticated.isErr()) {
        throw new Error(authenticated.error.message)
      }

      const sessionClient = authenticated.value

      // Step 2: Create Account Metadata
      const metadata = account({
        name: formData.name,
        bio: formData.bio,
        picture: formData.picture,
        coverPicture: formData.coverPicture,
      })

      // Step 3: Upload Metadata
      const { uri: metadataUri } = await storageClient.uploadAsJson(metadata)

      // Step 4 & 5: Create Account and Handle Result
      const result = await createAccountWithUsername(sessionClient, {
        username: { localName: formData.name.toLowerCase().replace(/\s+/g, "") },
        metadataUri: uri(metadataUri),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
        .andThen((txHash) => fetchAccount(sessionClient, { txHash }))
        .andThen((account) =>
          sessionClient.switchAccount({
            account: account?.address ?? never("Account not found"),
          })
        )

      console.log("result", result)

      if (result.isErr()) {
        const error = result.error as Error
        throw new Error(error.message)
      }

      toast.success("Account created successfully!")
      router.push("/feed")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full fixed inset-0 bg-[#f2f2f2]">
      <div className="w-full max-w-[420px] mx-auto h-full bg-white shadow-xl overflow-hidden">
        <div className="container px-4 py-10">
          <h1 className="text-3xl font-bold mb-8">Create Your Lens Account</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border-2 border-black rounded brutalist-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-2 border-2 border-black rounded brutalist-input"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Profile Picture URL</label>
              <input
                type="url"
                value={formData.picture}
                onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                className="w-full p-2 border-2 border-black rounded brutalist-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cover Picture URL</label>
              <input
                type="url"
                value={formData.coverPicture}
                onChange={(e) => setFormData({ ...formData, coverPicture: e.target.value })}
                className="w-full p-2 border-2 border-black rounded brutalist-input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#004aad] text-white py-3 px-4 rounded brutalist-button"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}