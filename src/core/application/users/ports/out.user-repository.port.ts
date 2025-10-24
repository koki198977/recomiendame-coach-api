import { UserEntity } from '../../../domain/users/entities';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe?: boolean;
}

export interface UserRepositoryPort {
  create(data: { id?: string; email: string; passwordHash: string }): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserEntity | null>;
  list(params: { skip?: number; take?: number }): Promise<{ items: UserEntity[]; total: number }>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  delete(userId: string): Promise<void>;
  
  // Métodos para sistema social
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserProfile(userId: string, viewerId?: string): Promise<UserProfile | null>;
  searchUsers(query: string, params: { skip: number; take: number }): Promise<{ items: UserProfile[]; total: number }>;
  getSuggestedUsers(userId: string, params: { skip: number; take: number }): Promise<{ items: UserProfile[]; total: number }>;
  getUserFollowers(userId: string, params: { skip: number; take: number }): Promise<{ items: UserProfile[]; total: number }>;
  getUserFollowing(userId: string, params: { skip: number; take: number }): Promise<{ items: UserProfile[]; total: number }>;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
