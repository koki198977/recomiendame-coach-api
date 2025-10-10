import { UserEntity } from '../../../domain/users/entities';

export interface UserRepositoryPort {
  create(data: { id?: string; email: string; passwordHash: string }): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  list(params: { skip?: number; take?: number }): Promise<{ items: UserEntity[]; total: number }>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
