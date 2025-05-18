"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { post } from "@lens-protocol/client/actions";
import { postId, uri } from "@lens-protocol/client";
import { lensClient } from "@/lib/lens";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { useLensStore } from "@/lib/useLensStore";
import { signMessageWith } from "@lens-protocol/client/viem";

interface Comment {
  id: string;
  author: string;
  text: string;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onAddComment?: (comment: Comment) => void;
}

export default function CommentSection({ postId, initialComments = [], onAddComment }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulate fetching comments from a backend (replace with real fetch in production)
  // useEffect(() => { ... }, [postId]);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const sessionClient = useLensStore((state) => state.sessionClient);
  const setSessionClient = useLensStore((state) => state.setSessionClient);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      if (!address || !isConnected) {
        toast.error("Please connect your wallet first");
        setLoading(false);
        return;
      }
      if (!walletClient) {
        toast.error("Wallet client not available");
        setLoading(false);
        return;
      }
      // Authenticate if not already
      let client = sessionClient;
      if (!client) {
        const lensAccountAddress = localStorage.getItem("lensAccountAddress");
        if (!lensAccountAddress) {
          toast.error("No Lens account found. Please create or connect your Lens profile.");
          setLoading(false);
          return;
        }
        const loginResult = await lensClient.login({
          accountOwner: {
            app: process.env.NEXT_PUBLIC_LENS_APP_ID,
            owner: address,
            account: lensAccountAddress,
          },
          signMessage: signMessageWith(walletClient),
        });
        if (loginResult.isErr()) {
          toast.error("Lens authentication failed");
          setLoading(false);
          return;
        }
        client = loginResult.value;
        setSessionClient(client);
      }
      // Simulate metadata upload (replace with real upload, e.g., IPFS)
      const metadataUri = `lens://comment/${Date.now()}`; // placeholder
      // Post comment on Lens
      const result = await post(client, {
        contentUri: uri(metadataUri),
        commentOn: {
          post: postId(postId.toString()),
        },
      });
      if (result.isErr()) {
        toast.error("Failed to post comment on Lens");
        setLoading(false);
        return;
      }
      const newComment: Comment = {
        id: `${Date.now()}`,
        author: "You",
        text: commentText,
      };
      setComments([...comments, newComment]);
      setCommentText("");
      if (onAddComment) onAddComment(newComment);
      toast.success("Comment posted to Lens!");
    } catch (error) {
      toast.error("Error posting comment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-2 max-h-40 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-gray-400 text-sm">No comments yet.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="mb-2">
              <span className="font-semibold text-xs mr-2">{comment.author}:</span>
              <span className="text-sm">{comment.text}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 text-black dark:text-white dark:bg-gray-800"
          placeholder="Add a comment..."
          disabled={loading}
        />
        <Button size="sm" onClick={handleAddComment} disabled={loading || !commentText.trim()}>
          Post
        </Button>
      </div>
    </div>
  );
}
