import { Body, Controller, Post, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post('bill')
  async getBillReport(@Body() body: any, @Res() response: Response) {
    const pdfDoc = await this.reportsService.getBillReport(body);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'Reporte de Presupuestos';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Post('bill-event')
  async getBillEventReport(@Body() body: any, @Res() response: Response) {
    const pdfDoc = await this.reportsService.getBillEventReport(body);

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'Reporte de Eventos';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
}
