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
    // Log para debugging
    console.log('📥 Audio file received:', {
      fieldname: audioFile?.fieldname,
      originalname: audioFile?.originalname,
      mimetype: audioFile?.mimetype,
      size: audioFile?.size,
      exists: !!audioFile,
    });

    if (!audioFile) {
      throw new BadRequestException('No se proporcionó archivo de audio');
    }

    // Validar formato - Ampliar lista de mimetypes aceptados
    const allowedFormats = [
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm',
      'application/octet-stream', // A veces los archivos llegan con este mimetype
    ];
    
    if (!allowedFormats.includes(audioFile.mimetype)) {
      console.error('❌ Mimetype no soportado:', audioFile.mimetype);
      console.error('Mimetypes permitidos:', allowedFormats);
      throw new BadRequestException(
        `Formato de audio no soportado: ${audioFile.mimetype}. Use M4A, MP3, WAV o OGG`
      );
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      throw new BadRequestException('El archivo de audio es demasiado grande (máximo 10MB)');
    }

    console.log('✅ Audio file validated, proceeding to transcription...');

    try {
      // Convertir buffer a File usando la utilidad de OpenAI
      const file = await toFile(audioFile.buffer, audioFile.originalname, {
        type: audioFile.mimetype,
      });

      console.log('🎤 Sending to OpenAI Whisper...');

      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'es',
      });

      console.log('✅ Transcription completed:', transcription.text.substring(0, 100));

      return { transcription: transcription.text };
    } catch (error: any) {
      console.error('❌ Error transcribiendo audio:', error);
      throw new BadRequestException(`Error al transcribir el audio: ${error.message}`);
    }
  }
}
