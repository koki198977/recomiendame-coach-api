import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CloudinaryService } from '../storage/cloudinary.service';
import { multerConfig } from '../storage/multer.config';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.cloudinaryService.uploadImage(file, 'media');
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Post('equipment/upload')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async uploadEquipment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.cloudinaryService.uploadImage(file, 'equipment');
    return {
      url: result.url,
      publicId: result.publicId,
    };
  }
}
