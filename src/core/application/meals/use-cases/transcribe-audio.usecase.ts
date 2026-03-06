import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { toFile } from 'openai/uploads';

@Injectable()
export class TranscribeAudioUseCase {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async execute(audioFile: Express.Multer.File): Promise<{ transcription: string }> {
    if (!audioFile) {
      throw new BadRequestException('No se proporcionó archivo de audio');
    }

    // Validar formato
    const allowedFormats = ['audio/m4a', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedFormats.includes(audioFile.mimetype)) {
      throw new BadRequestException(
        'Formato de audio no soportado. Use M4A, MP3, WAV o OGG'
      );
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      throw new BadRequestException('El archivo de audio es demasiado grande (máximo 10MB)');
    }

    try {
      // Convertir buffer a File usando la utilidad de OpenAI
      const file = await toFile(audioFile.buffer, audioFile.originalname, {
        type: audioFile.mimetype,
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'es',
      });

      return { transcription: transcription.text };
    } catch (error) {
      console.error('Error transcribiendo audio:', error);
      throw new BadRequestException('Error al transcribir el audio');
    }
  }
}
