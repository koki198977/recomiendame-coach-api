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

@Module({
  imports: [
    PrismaModule, PlansModule, UsersModule, AuthModule, CheckinsModule, 
    MeModule, MeFeedModule, PostsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
