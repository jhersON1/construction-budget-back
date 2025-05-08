import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  checkCompleteStatusUseCase,
  createMessageUseCase,
  createRunUseCase,
  createThreadUseCase,
  getMessageListUseCase,
} from './use-cases';
import { QuestionDto } from './dto/question.dto';

@Injectable()
export class AssistantService {
  private openai: OpenAI;

  constructor(readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createThread() {
    return await createThreadUseCase(this.openai);
  }

  async userQuestion(questionDto: QuestionDto, image?: Express.Multer.File) {
    const { threadId, question } = questionDto;

    const message = await createMessageUseCase(this.openai, {
      threadId,
      question,
      fileContent: image?.buffer,
      fileName: image?.originalname,
    });

    const run = await createRunUseCase(this.openai, { threadId });

    await checkCompleteStatusUseCase(this.openai, {
      runId: run.id,
      threadId,
    });

    const messages = await getMessageListUseCase(this.openai, { threadId });

    console.log('>>> Mensajes:', messages);

    // 1) Filtramos SOLO los mensajes del asistente
    const assistantMsgs = messages.filter((msg) => msg.role === 'assistant');
    if (assistantMsgs.length === 0) {
      console.warn('No se encontró ningún mensaje de assistant en el hilo');
      return messages;
    }

    // 2) Tomamos el último (el más reciente)
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];

    // 3) Concatenamos todas las partes de texto (ignoramos imágenes u otros objetos)
    const textoCompleto = (lastAssistant.content as Array<any>)
      .filter((part) => typeof part === 'string')
      .join('\n')
      // opcional: quitamos citas de fuente estilo “” para no confundir a GPT
      .replace(/【.*?†source】/g, '');

    console.log('>>> Texto a convertir:', textoCompleto);


    return messages;
  }

  async convertTexttoJson(
    messages: { role: 'user' | 'assistant'; content: any }[],
  ) {
    // 1) Filtramos SOLO los mensajes del asistente
    const assistantMsgs = messages.filter((msg) => msg.role === 'assistant');
    if (assistantMsgs.length === 0) {
      console.warn('No se encontró ningún mensaje de assistant en el hilo');
      return messages;
    }

    // 2) Tomamos el último (el más reciente)
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];

    // 3) Concatenamos todas las partes de texto (ignoramos imágenes u otros objetos)
    const textoCompleto = (lastAssistant.content as Array<any>)
      .filter((part) => typeof part === 'string')
      .join('\n')
      // opcional: quitamos citas de fuente estilo “” para no confundir a GPT
      .replace(/【.*?†source】/g, '');

    console.log('>>> Texto a convertir:', textoCompleto);

    // 4) Llamamos al servicio de formato
    const presupuestoJson = await this.formatPresupuesto(textoCompleto);

    return presupuestoJson;
  }

  async formatPresupuesto(textoPresupuesto: string): Promise<{
    presupuestos: Array<{
      tipo: string;
      partidas: Array<{
        material: string;
        cantidad: number | null;
        precio_unitario: number | null;
        proveedor: string;
        subtotal: number;
      }>;
      totales: {
        materiales: number;
        mano_de_obra: number;
        extras: number;
        costo_total_estimado: number;
      };
      justificacion_tecnica: string;
      moneda: string;
    }>;
  }> {
    // 1) Limpieza básica para quitar markdown, citas de fuente, etc.
    const limpio = textoPresupuesto
      .replace(/[\s\S]*?/g, '') // quita bloques de código
      .replace(/###.*\n/g, '') // quita encabezados markdown
      .replace(/【.*?†source】/g, '') // quita referencias de fuente
      .trim();

    // 2) Llamada a OpenAI con Function Calling
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: `
Eres un servicio que recibe un bloque de texto con uno o varios presupuestos (p. ej. “Presupuesto Solicitado (Económico)”, “Presupuesto Recomendado (Estándar)”, etc.) y DEVUELVES SÓLO JSON con esta estructura:

{
  "presupuestos": [
    {
      "tipo": "string (el título del presupuesto, tal cual aparece en el texto)",
      "partidas": [
        {
          "material": "string",
          "cantidad": number | null,
          "precio_unitario": number | null,
          "proveedor": "string",
          "subtotal": number
        },
        …
      ],
      "totales": {
        "materiales": number,
        "mano_de_obra": number,
        "extras": number,
        "costo_total_estimado": number
      },
      "justificacion_tecnica": "string",
      "moneda": "string"
    },
    …
  ]
}
          `.trim(),
        },
        { role: 'user', content: limpio },
      ],
      functions: [
        {
          name: 'generar_presupuestos',
          description:
            'Extrae todos los presupuestos del texto y los devuelve en un array.',
          parameters: {
            type: 'object',
            properties: {
              presupuestos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tipo: { type: 'string' },
                    partidas: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          material: { type: 'string' },
                          cantidad: { type: ['number', 'null'] },
                          precio_unitario: { type: ['number', 'null'] },
                          proveedor: { type: 'string' },
                          subtotal: { type: 'number' },
                        },
                        required: ['material', 'proveedor', 'subtotal'],
                      },
                    },
                    totales: {
                      type: 'object',
                      properties: {
                        materiales: { type: 'number' },
                        mano_de_obra: { type: 'number' },
                        extras: { type: 'number' },
                        costo_total_estimado: { type: 'number' },
                      },
                      required: [
                        'materiales',
                        'mano_de_obra',
                        'extras',
                        'costo_total_estimado',
                      ],
                    },
                    justificacion_tecnica: { type: 'string' },
                    moneda: { type: 'string' },
                  },
                  required: [
                    'tipo',
                    'partidas',
                    'totales',
                    'justificacion_tecnica',
                    'moneda',
                  ],
                },
              },
            },
            required: ['presupuestos'],
          },
        },
      ],
      function_call: { name: 'generar_presupuestos' },
    });

    // 3) Parseamos y devolvemos
    const args = response.choices[0].message.function_call?.arguments || '{}';
    return JSON.parse(args);
  }
}
