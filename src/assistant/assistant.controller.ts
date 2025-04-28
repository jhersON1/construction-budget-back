import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { QuestionDto } from './dto/question.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('create-thread')
  async createThread() {
    return await this.assistantService.createThread();
  }

  @Post('user-question')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async userQuestion(
    @Body() questionDto: QuestionDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.assistantService.userQuestion(questionDto, image);
  }

  @Post('text-to-json')
  async convertTextToJson(
    @Body('messages') messages: { role: 'user' | 'assistant'; content: any }[],
  ): Promise<any> {
    return this.assistantService.convertTexttoJson(messages);
  }
}
