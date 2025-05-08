import { Module } from '@nestjs/common';
import { AssitantEventService } from './assitant-event.service';
import { AssitantEventController } from './assitant-event.controller';

@Module({
  controllers: [AssitantEventController],
  providers: [AssitantEventService],
})
export class AssitantEventModule {}
