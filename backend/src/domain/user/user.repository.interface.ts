import type { UpdateUserProfile, UserProfile } from "./types/user.types";

export interface IUserRepository {
  findById(id: string, accessToken: string): Promise<UserProfile | null>;
  ensureRow(id: string, accessToken: string): Promise<UserProfile>;
  update(id: string, patch: UpdateUserProfile, accessToken: string): Promise<UserProfile>;
}

export const USER_REPOSITORY = Symbol("IUserRepository");
