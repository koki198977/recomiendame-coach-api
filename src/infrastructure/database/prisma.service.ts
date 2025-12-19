import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxRetries = 10, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
        
        if (i === maxRetries - 1) {
          this.logger.error('Max database connection retries reached');
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
