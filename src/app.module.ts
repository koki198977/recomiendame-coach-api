import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { TaxonomiesAdminModule } from './modules/taxonomies-admin.module';
import { WorkoutsModule } from './modules/workouts.module';
import { ChapiModule } from './modules/chapi.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PlansModule,
    WorkoutsModule,
    ChapiModule,
    CheckinsModule,
    MeModule,
    MeFeedModule,
    PostsModule,
    ProfileModule,
    TaxonomiesModule,
    GamificationModule,
    TaxonomiesAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
