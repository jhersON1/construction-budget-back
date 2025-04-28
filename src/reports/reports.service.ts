import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PrinterService } from 'src/printer/printer.service';
import { billReport } from './documents/bill.report';

@Injectable()
export class ReportsService {
  constructor(private readonly printer: PrinterService) {}

  async getBillReport(data: any): Promise<PDFKit.PDFDocument> {
    const docDefinition: TDocumentDefinitions = billReport(data);
    return this.printer.createPdf(docDefinition);
  }
}
