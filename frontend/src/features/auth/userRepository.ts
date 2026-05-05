import type { UserProfile } from './types';

export interface UserRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<void>;
}
