/**
 * Post Service
 * Handles community posts, comments, reactions, and saved posts
 */

import { supabase } from '@/lib/supabase/client';

export interface Post {
  id: string;
  authorId: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
  communityId?: string;
  content: string;
  photos: string[];
  postType: string;
  tags: string[];
  locationName?: string;
  commentCount: number;
  reactionsCount: Record<string, number>;
  saveCount: number;
  shareCount: number;
  status: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
  content: string;
  parentCommentId?: string;
  likeCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class PostService {
  // ============================================
  // POSTS
  // ============================================

  async getPosts(options?: {
    communityId?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .in('status', ['published', 'active'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.communityId) {
      query = query.eq('community_id', options.communityId);
    }

    if (options?.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapPost);
  }

  async getPost(postId: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('id', postId)
      .single();

    if (error || !data) return null;
    return this.mapPost(data);
  }

  async createPost(
    userId: string,
    data: {
      content: string;
      communityId?: string;
      photos?: string[];
      postType?: string;
      tags?: string[];
      locationName?: string;
      locationLat?: number;
      locationLng?: number;
    }
  ): Promise<Post> {
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: userId,
        community_id: data.communityId,
        content: data.content,
        photos: data.photos || [],
        post_type: data.postType || 'general',
        tags: data.tags || [],
        location_name: data.locationName,
        location_lat: data.locationLat,
        location_lng: data.locationLng,
      })
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);
    return this.mapPost(post);
  }

  async updatePost(
    postId: string,
    updates: Partial<{ content: string; photos: string[]; tags: string[] }>
  ): Promise<Post> {
    const mapped: Record<string, unknown> = {};
    if (updates.content !== undefined) mapped.content = updates.content;
    if (updates.photos !== undefined) mapped.photos = updates.photos;
    if (updates.tags !== undefined) mapped.tags = updates.tags;
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('community_posts')
      .update(mapped)
      .eq('id', postId)
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);
    return this.mapPost(data);
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('community_posts')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) throw new Error(error.message);
  }

  // ============================================
  // COMMENTS
  // ============================================

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('post_id', postId)
      .in('status', ['published', 'active'])
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapComment);
  }

  async addComment(
    postId: string,
    userId: string,
    data: { content: string; parentCommentId?: string }
  ): Promise<Comment> {
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: userId,
        content: data.content,
        parent_comment_id: data.parentCommentId,
      })
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);

    try {
      const { error: rpcError } = await supabase.rpc('increment_field', {
        table_name: 'community_posts',
        row_id: postId,
        field_name: 'comment_count',
        amount: 1,
      });
      if (rpcError) {
        const { data: post } = await supabase
          .from('community_posts')
          .select('comment_count')
          .eq('id', postId)
          .single();
        if (post) {
          await supabase
            .from('community_posts')
            .update({ comment_count: (post.comment_count || 0) + 1 })
            .eq('id', postId);
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('Failed to increment comment count:', e);
    }

    // Fire notification to post author (if commenter is not the author)
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('author_id, content')
        .eq('id', postId)
        .single();

      if (post && post.author_id !== userId) {
        const { data: commenterProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        const commenterName = commenterProfile
          ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
          : 'Someone';

        if (data.parentCommentId) {
          // Reply to a comment — notify the parent comment author
          const { data: parentComment } = await supabase
            .from('post_comments')
            .select('author_id')
            .eq('id', data.parentCommentId)
            .single();

          if (parentComment && parentComment.author_id !== userId) {
            const { notifyCommentReply } = await import('@/services/notifications/community-notifications');
            await notifyCommentReply(parentComment.author_id, commenterName, postId, '');
          }
        } else {
          // Top-level comment — notify the post author
          const { notifyPostComment } = await import('@/services/notifications/community-notifications');
          const postTitle = (post.content || '').substring(0, 60);
          await notifyPostComment(post.author_id, commenterName, postTitle, postId, '');
        }
      }
    } catch (notifErr) {
      if (__DEV__) console.warn('[PostService] Comment notification error:', notifErr);
    }

    return this.mapComment(comment);
  }

  async deleteComment(commentId: string, postId: string): Promise<void> {
    const { error } = await supabase
      .from('post_comments')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', commentId);

    if (error) throw new Error(error.message);

    try {
      const { error: rpcError } = await supabase.rpc('increment_field', {
        table_name: 'community_posts',
        row_id: postId,
        field_name: 'comment_count',
        amount: -1,
      });
      if (rpcError) {
        const { data: post } = await supabase
          .from('community_posts')
          .select('comment_count')
          .eq('id', postId)
          .single();
        if (post) {
          await supabase
            .from('community_posts')
            .update({ comment_count: Math.max(0, (post.comment_count || 0) - 1) })
            .eq('id', postId);
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('Failed to decrement comment count:', e);
    }
  }

  // ============================================
  // REACTIONS
  // ============================================

  /**
   * Get user's reactions for a batch of posts
   * Returns a map of postId → reactionType
   */
  async getUserReactions(
    userId: string,
    postIds: string[]
  ): Promise<Record<string, string>> {
    if (!userId || postIds.length === 0) return {};

    const { data, error } = await supabase
      .from('post_reactions')
      .select('post_id, reaction_type')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) {
      map[row.post_id] = row.reaction_type;
    }
    return map;
  }

  /**
   * Check if user has saved specific posts
   * Returns a set of saved post IDs
   */
  async getUserSavedPostIds(
    userId: string,
    postIds: string[]
  ): Promise<Set<string>> {
    if (!userId || postIds.length === 0) return new Set();

    const { data, error } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error || !data) return new Set();
    return new Set(data.map((r: any) => r.post_id));
  }

  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: string
  ): Promise<boolean> {
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .single();

    if (existing) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);

      await this.updateReactionsCount(postId, reactionType, -1);
      return false;
    }

    const { error } = await supabase
      .from('post_reactions')
      .insert({
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType,
      });

    if (error) throw new Error(error.message);

    await this.updateReactionsCount(postId, reactionType, 1);

    // Notify post author about the reaction
    try {
      const { data: post } = await supabase
        .from('community_posts')
        .select('author_id')
        .eq('id', postId)
        .single();

      if (post && post.author_id !== userId) {
        const { data: reactorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        const reactorName = reactorProfile
          ? `${reactorProfile.first_name || ''} ${reactorProfile.last_name || ''}`.trim() || 'Someone'
          : 'Someone';

        const { notifyPostReaction } = await import('@/services/notifications/community-notifications');
        await notifyPostReaction(post.author_id, reactorName, reactionType, postId, '');
      }
    } catch (_) {}

    return true;
  }

  private async updateReactionsCount(
    postId: string,
    reactionType: string,
    delta: number
  ): Promise<void> {
    const { data: post } = await supabase
      .from('community_posts')
      .select('reactions_count')
      .eq('id', postId)
      .single();

    const counts: Record<string, number> = (post?.reactions_count as Record<string, number>) || {};
    counts[reactionType] = Math.max(0, (counts[reactionType] || 0) + delta);

    await supabase
      .from('community_posts')
      .update({ reactions_count: counts })
      .eq('id', postId);
  }

  // ============================================
  // COMMENT LIKES
  // ============================================

  async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existing.id);

      await this.updateCommentLikeCount(commentId, -1);
      return false;
    }

    const { error } = await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId });

    if (error) throw new Error(error.message);

    await this.updateCommentLikeCount(commentId, 1);
    return true;
  }

  private async updateCommentLikeCount(commentId: string, delta: number): Promise<void> {
    const { data: comment } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    if (comment) {
      await supabase
        .from('post_comments')
        .update({ like_count: Math.max(0, (comment.like_count || 0) + delta) })
        .eq('id', commentId);
    }
  }

  // ============================================
  // SAVED POSTS
  // ============================================

  async savePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ post_id: postId, user_id: userId });

    if (error) throw new Error(error.message);

    const { data: post } = await supabase
      .from('community_posts')
      .select('save_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('community_posts')
        .update({ save_count: (post.save_count || 0) + 1 })
        .eq('id', postId);
    }
  }

  async unsavePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const { data: post } = await supabase
      .from('community_posts')
      .select('save_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('community_posts')
        .update({ save_count: Math.max(0, (post.save_count || 0) - 1) })
        .eq('id', postId);
    }
  }

  async getSavedPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        post:community_posts(
          *,
          author:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || [])
      .filter((row: any) => row.post)
      .map((row: any) => this.mapPost(row.post));
  }

  // ============================================
  // FEED
  // ============================================

  async getFeed(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Post[]> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    // Get communities the user is a member of
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const communityIds = (memberships || []).map((m: any) => m.group_id);

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .in('status', ['published', 'active'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (communityIds.length > 0) {
      // Posts from user's communities OR posts with no community (public)
      query = query.or(
        `community_id.in.(${communityIds.join(',')}),community_id.is.null`
      );
    } else {
      query = query.is('community_id', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapPost);
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapPost = (data: any): Post => {
    const author = data.author;
    return {
      id: data.id,
      authorId: data.author_id,
      author: author
        ? {
            id: author.id,
            fullName: [author.first_name, author.last_name].filter(Boolean).join(' '),
            avatarUrl: author.avatar_url,
          }
        : undefined,
      communityId: data.community_id,
      content: data.content,
      photos: data.photos || [],
      postType: data.post_type || 'general',
      tags: data.tags || [],
      locationName: data.location_name,
      commentCount: data.comment_count || 0,
      reactionsCount: (data.reactions_count as Record<string, number>) || {},
      saveCount: data.save_count || 0,
      shareCount: data.share_count || 0,
      status: data.status || 'active',
      isPinned: data.is_pinned || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapComment = (data: any): Comment => {
    const author = data.author;
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      author: author
        ? {
            id: author.id,
            fullName: [author.first_name, author.last_name].filter(Boolean).join(' '),
            avatarUrl: author.avatar_url,
          }
        : undefined,
      content: data.content,
      parentCommentId: data.parent_comment_id,
      likeCount: data.like_count || 0,
      status: data.status || 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const postService = new PostService();
export default postService;
