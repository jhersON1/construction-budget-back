import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssistantModule } from './assistant/assistant.module';
import { ConfigModule } from '@nestjs/config';
import { ReportsModule } from './reports/reports.module';
import { PrinterModule } from './printer/printer.module';
import { AssitantEventModule } from './assitant-event/assitant-event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AssistantModule,
    ReportsModule,
    PrinterModule,
    AssitantEventModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
