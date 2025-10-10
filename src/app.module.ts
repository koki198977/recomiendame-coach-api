import { Module } from '@nestjs/common';
import { PlansModule } from './modules/plans.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { UsersModule } from './modules/users.module';
import { AuthModule } from './modules/auth.module';
import { CheckinsModule } from './modules/checkins.module';
import { MeModule } from './modules/me.module';
import { MeFeedModule } from './modules/me-feed.module';
import { PostsModule } from './modules/posts.module';
import { ProfileModule } from './modules/profile.module';
import { TaxonomiesModule } from './modules/taxonomies.module';
import { GamificationModule } from './modules/gamification.module';

@Module({
  imports: [
    PrismaModule, PlansModule, UsersModule, AuthModule, CheckinsModule, 
    MeModule, MeFeedModule, PostsModule, ProfileModule, TaxonomiesModule,
    GamificationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
