import { Module } from '@nestjs/common';
import { MediaController } from '../infrastructure/http/media.controller';
import { StorageModule } from '../infrastructure/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [MediaController],
})
export class MediaModule {}
