import { Injectable, Inject } from '@nestjs/common';
import {
  AdminContentRepositoryPort,
  ADMIN_CONTENT_REPOSITORY,
} from '../ports/out.admin-content-repository.port';
import { ListNutritionProductsDto } from '../dto/list-nutrition-products.dto';
import { ListPostsAdminDto } from '../dto/list-posts-admin.dto';

@Injectable()
export class AdminContentUseCase {
  constructor(
    @Inject(ADMIN_CONTENT_REPOSITORY)
    private readonly repo: AdminContentRepositoryPort,
  ) {}

  listNutritionProducts(dto: ListNutritionProductsDto) {
    return this.repo.listNutritionProducts({ search: dto.search, page: dto.page, limit: dto.limit });
  }

  deleteNutritionProduct(id: string) {
    return this.repo.deleteNutritionProduct(id);
  }

  listPosts(dto: ListPostsAdminDto) {
    return this.repo.listPosts({ page: dto.page, limit: dto.limit });
  }

  deletePost(id: string) {
    return this.repo.deletePost(id);
  }

  listChallenges(dto: ListPostsAdminDto) {
    return this.repo.listChallenges({ page: dto.page, limit: dto.limit });
  }
}
