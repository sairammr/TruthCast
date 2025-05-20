"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { lensClient } from "@/lib/lens";
import { MetadataAttributeType, account } from "@lens-protocol/metadata";
import { storageClient } from "@/lib/storageClient";
import { uri } from "@lens-protocol/client";
import {
  createAccountWithUsername,
  fetchAccount,
} from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { never } from "@lens-protocol/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";

// Function to convert Lens URI to HTTP URL
const getLensUrl = (uri: string) => {
  if (!uri) return "";
  if (uri.startsWith("lens://")) {
    return `https://arweave.net/${uri.replace("lens://", "")}`;
  }
  return uri;
};

export default function RegisterPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    picture: "",
    coverPicture: "",
    tags: [] as string[],
  });
  const [uploading, setUploading] = useState({
    picture: false,
    coverPicture: false,
  });
  const [previewUrls, setPreviewUrls] = useState({
    picture: "",
    coverPicture: "",
  });

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrls.picture) URL.revokeObjectURL(previewUrls.picture);
      if (previewUrls.coverPicture)
        URL.revokeObjectURL(previewUrls.coverPicture);
    };
  }, []);

  const handleImageUpload = async (
    file: File,
    type: "picture" | "coverPicture"
  ) => {
    if (!file) return;
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [type]: previewUrl }));

      // Upload to Lens Storage
      const uploadRes = await storageClient.uploadFile(file);
      if (!uploadRes) throw new Error("Failed to upload image");

      setFormData((prev) => ({ ...prev, [type]: uploadRes.uri }));
      toast.success(
        `${
          type === "picture" ? "Profile" : "Cover"
        } picture uploaded successfully!`
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
      // Clear preview on error
      setPreviewUrls((prev) => ({ ...prev, [type]: "" }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveImage = (type: "picture" | "coverPicture") => {
    // Revoke the preview URL if it exists
    if (previewUrls[type]) {
      URL.revokeObjectURL(previewUrls[type]);
    }
    setPreviewUrls((prev) => ({ ...prev, [type]: "" }));
    setFormData((prev) => ({ ...prev, [type]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !walletClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Authenticate as Onboarding User
      const authenticated = await lensClient.login({
        onboardingUser: {
          app: process.env.NEXT_PUBLIC_LENS_APP_ID,
          wallet: address,
        },
        signMessage: (message) => walletClient.signMessage({ message }),
      });

      if (authenticated.isErr()) {
        throw new Error(authenticated.error.message);
      }

      const sessionClient = authenticated.value;

      // Step 2: Create Account Metadata
      const metadata = account({
        name: formData.name,
        bio: formData.bio,
        picture: formData.picture,
        coverPicture: formData.coverPicture,
      });

      // Step 3: Upload Metadata
      const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);

      // Step 4 & 5: Create Account and Handle Result
      const result = await createAccountWithUsername(sessionClient, {
        username: {
          localName: formData.name.toLowerCase().replace(/\s+/g, ""),
        },
        metadataUri: uri(metadataUri),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
        .andThen((txHash) => fetchAccount(sessionClient, { txHash }))
        .andThen((account) =>
          sessionClient.switchAccount({
            account: account?.address ?? never("Account not found"),
          })
        );

      if (result.isErr()) {
        const error = result.error as Error;
        throw new Error(error.message);
      }

      toast.success("Account created successfully!");
      router.push("/feed");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 overflow-y-auto pt-10 pb-10">
        <div className="w-full max-w-[480px] mx-auto px-4">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Create Your Lens Account
                </h1>
                <p className="text-gray-500 mt-2">
                  Join the decentralized social network
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      required
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.picture || previewUrls.picture ? (
                        <div className="relative w-24 h-24 group">
                          <img
                            src={
                              previewUrls.picture ||
                              getLensUrl(formData.picture)
                            }
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full ring-2 ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("picture")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleImageUpload(e.target.files[0], "picture")
                            }
                            className="hidden"
                          />
                          <ImagePlus className="w-8 h-8 text-gray-400" />
                        </label>
                      )}
                      {uploading.picture && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Picture
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.coverPicture || previewUrls.coverPicture ? (
                        <div className="relative w-48 h-32 group">
                          <img
                            src={
                              previewUrls.coverPicture ||
                              getLensUrl(formData.coverPicture)
                            }
                            alt="Cover"
                            className="w-full h-full object-cover rounded-xl ring-2 ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("coverPicture")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleImageUpload(
                                e.target.files[0],
                                "coverPicture"
                              )
                            }
                            className="hidden"
                          />
                          <ImagePlus className="w-8 h-8 text-gray-400" />
                        </label>
                      )}
                      {uploading.coverPicture && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3.5 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
