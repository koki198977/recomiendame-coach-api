export interface AdminNutritionProduct {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string | null;
  allergens: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface AdminPost {
  id: string;
  authorId: string;
  authorEmail: string;
  caption: string | null;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export interface AdminChallenge {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  visibility: string;
  membersCount: number;
}

export interface AdminContentRepositoryPort {
  listNutritionProducts(params: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminNutritionProduct[]; total: number }>;
  deleteNutritionProduct(id: string): Promise<void>;

  listPosts(params: { page: number; limit: number }): Promise<{ items: AdminPost[]; total: number }>;
  deletePost(id: string): Promise<void>;

  listChallenges(params: { page: number; limit: number }): Promise<{ items: AdminChallenge[]; total: number }>;
}

export const ADMIN_CONTENT_REPOSITORY = Symbol('ADMIN_CONTENT_REPOSITORY');
