/**
 * ForageWise — Comments Service
 * 
 * Manages comments on community posts via PocketBase.
 * Comments are stored in the 'post_comments' collection.
 */

import { pb } from '@/auth/authService';

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  text: string;
  parentId?: string;
  votes: number;
  created: string;
}

/**
 * Fetch comments for a post from PocketBase.
 */
export async function fetchComments(postId: string): Promise<PostComment[]> {
  try {
    const result = await pb.collection('post_comments').getList(1, 100, {
      filter: `postId = "${postId}"`,
      sort: '-created',
    });
    return result.items.map((record) => ({
      id: record.id,
      postId: (record.postId as string) || '',
      userId: (record.userId as string) || '',
      userName: (record.userName as string) || 'Anonymous',
      text: (record.text as string) || '',
      parentId: (record.parentId as string) || undefined,
      votes: (record.votes as number) || 0,
      created: record.created as string,
    }));
  } catch {
    return [];
  }
}

/**
 * Create a comment on a post.
 */
export async function createComment(data: {
  postId: string;
  text: string;
  parentId?: string;
}): Promise<PostComment | null> {
  try {
    if (!pb.authStore.isValid) return null;
    const record = await pb.collection('post_comments').create({
      postId: data.postId,
      userId: pb.authStore.record?.id || '',
      userName: pb.authStore.record?.name || 'Anonymous',
      text: data.text,
      parentId: data.parentId || '',
      votes: 0,
    });
    return {
      id: record.id,
      postId: (record.postId as string) || '',
      userId: (record.userId as string) || '',
      userName: (record.userName as string) || 'Anonymous',
      text: (record.text as string) || '',
      parentId: (record.parentId as string) || undefined,
      votes: (record.votes as number) || 0,
      created: record.created as string,
    };
  } catch {
    return null;
  }
}

/**
 * Vote on a comment (increment or decrement).
 */
export async function voteComment(commentId: string, direction: 1 | -1): Promise<boolean> {
  try {
    if (!pb.authStore.isValid) return false;
    const record = await pb.collection('post_comments').getOne(commentId);
    const currentVotes = (record.votes as number) || 0;
    await pb.collection('post_comments').update(commentId, {
      votes: currentVotes + direction,
    });
    return true;
  } catch {
    return false;
  }
}
