import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AssitantEventService } from './assitant-event.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { QuestionDto } from './dto/question.dto';

@Controller('assitant-event')
export class AssitantEventController {
  constructor(private readonly assitantEventService: AssitantEventService) { }

  @Post('create-thread-event')
  async createThread() {
    return await this.assitantEventService.createThread();
  }

  @Post('user-question-event')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async userQuestion(
    @Body() questionDto: QuestionDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.assitantEventService.userQuestion(questionDto, image);
  }

  @Post('text-to-json-event')
  async convertTextToJson(
    @Body('messages') messages: { role: 'user' | 'assistant'; content: any }[],
  ): Promise<any> {
    return this.assitantEventService.convertTexttoJson(messages);
  }
}
