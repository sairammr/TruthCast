"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fetchPostReferences, post } from "@lens-protocol/client/actions";
import { postId, PostReferenceType, uri } from "@lens-protocol/client";
import { lensClient } from "@/lib/lens";
import { useAccount, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { storageClient } from "@/lib/storageClient";
import { textOnly } from "@lens-protocol/metadata";


interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface CommentSectionProps {
  postid: string;
  initialComments?: Comment[];
  onAddComment?: (comment: Comment) => void;
}

export default function CommentSection({ postid, initialComments = [], onAddComment }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();


  // Fetch comments when component mounts
  useEffect(() => {
    const fetchCommentsFromLens = async () => {
      setFetchingComments(true);
      try {
        const result = await fetchPostReferences(lensClient, {
          referencedPost: postId(postid), 
          referenceTypes: [PostReferenceType.CommentOn],
        });
        console.log('result', result);
        
        const items = result.isOk() ? result.value.items : [];
        const formattedComments = items.map((comment: any) => ({
          id: comment.id,
          author: comment.author?.username?.localName || "anonymous",
          text: comment.metadata?.content || "",
          createdAt: new Date(comment.timestamp).toLocaleString(),
        }));
        setComments(formattedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setFetchingComments(false);
      }
    };

    fetchCommentsFromLens();
  }, [postid]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    console.log('commentText', commentText);
    setLoading(true);
    try {
      if (!address || !isConnected) {
        toast.error("Please connect your wallet first");
        setLoading(false);
        return;
      }
      console.log('walletClient', walletClient);
      if (!walletClient) {
        toast.error("Wallet client not available");
        setLoading(false);
        return;
      }
      // Authenticate if not already
     
        

       const resumed = await lensClient.resumeSession();
        if (resumed.isErr()) {
          return console.error(resumed.error);
        }
        const sessionClient = resumed.value;
        const metadata = textOnly({
          content: commentText,
        });
        console.log('metadata', metadata);
      
      // Simulate metadata upload (replace with real upload, e.g., IPFS)
      const metadataUri = await storageClient.uploadAsJson(metadata);
      console.log('metadataUri', metadataUri);
      // Post comment on Lens
      const result = await post(sessionClient, {
        contentUri: uri(metadataUri.uri),
        commentOn: {
          post: postId(postid),
        },
      }).andThen(handleOperationWith(walletClient));
      console.log('result', result);
      if (result.isErr()) {
        toast.error("Failed to post comment on Lens");
        setLoading(false);
        return;
      }
      const newComment: Comment = {
        id: `${Date.now()}`,
        author: "You",
        text: commentText,
        createdAt: new Date().toISOString(),
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
        {fetchingComments ? (
          <div className="text-gray-400 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-gray-400 text-sm">No comments yet.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="mb-2 flex flex-col w-full">
              <span className="font-semibold text-xs mr-2 text-bold">{comment.author}</span>
              <div className="flex flex-row justify-between">
                <span className="text-sm">{comment.text}</span>
                <span className="text-xs text-gray-500">{comment.createdAt}</span>
              </div>
              <div className="mt-2 border-b border-gray-300 w-full"></div>
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
