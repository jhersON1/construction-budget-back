import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { QuestionDto } from './dto/question.dto';
import { createThreadUseCase, createMessageUseCase, createRunUseCase, checkCompleteStatusUseCase, getMessageListUseCase } from './use-cases';

@Injectable()
export class AssitantEventService {
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
            datos_generales: {
                tipo_evento: string;
                ubicacion: string;
                fecha: string;
                invitados: number;
                modalidad: string;
                presupuesto_maximo: string;
            };
            categorias: Array<{
                nombre: string;
                partidas: Array<{
                    material: string;
                    cantidad: string;
                    precio_unitario: number;
                    proveedor: string;
                    subtotal: number;
                }>;
                subtotal_categoria: number;
            }>;
            totales: {
                subtotal: number;
                honorarios: number;
                costo_total_estimado: number;
            };
            justificacion_tecnica: string;
            moneda: string;
        }>;
    }> {
        // 1) Limpieza básica
        const limpio = textoPresupuesto
            .replace(/```[\s\S]*?```/g, '') // quita bloques de código
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
Eres un servicio que recibe un bloque de texto con información de presupuesto para eventos y lo convierte a formato JSON estructurado. El texto incluye secciones como datos generales, categorías de gastos (marcadas con 🔹), partidas individuales, resumen general (✅) y justificación técnica (📌).

Tu tarea es extraer toda esta información y organizarla en la estructura JSON especificada.
          `.trim(),
                },
                { role: 'user', content: limpio },
            ],
            functions: [
                {
                    name: 'generar_presupuestos',
                    description:
                        'Extrae el presupuesto del texto y lo devuelve en formato estructurado.',
                    parameters: {
                        type: 'object',
                        properties: {
                            presupuestos: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        tipo: { type: 'string' },
                                        datos_generales: {
                                            type: 'object',
                                            properties: {
                                                tipo_evento: { type: 'string' },
                                                ubicacion: { type: 'string' },
                                                fecha: { type: 'string' },
                                                invitados: { type: 'number' },
                                                modalidad: { type: 'string' },
                                                presupuesto_maximo: { type: 'string' }
                                            }
                                        },
                                        categorias: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    nombre: { type: 'string' },
                                                    partidas: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                material: { type: 'string' },
                                                                cantidad: { type: 'string' },
                                                                precio_unitario: { type: 'number' },
                                                                proveedor: { type: 'string' },
                                                                subtotal: { type: 'number' }
                                                            }
                                                        }
                                                    },
                                                    subtotal_categoria: { type: 'number' }
                                                }
                                            }
                                        },
                                        totales: {
                                            type: 'object',
                                            properties: {
                                                subtotal: { type: 'number' },
                                                honorarios: { type: 'number' },
                                                costo_total_estimado: { type: 'number' }
                                            }
                                        },
                                        justificacion_tecnica: { type: 'string' },
                                        moneda: { type: 'string' }
                                    }
                                }
                            }
                        },
                        required: ['presupuestos']
                    }
                }
            ],
            function_call: { name: 'generar_presupuestos' },
        });

        // 3) Parseamos y devolvemos
        const args = response.choices[0].message.function_call?.arguments || '{}';
        return JSON.parse(args);
    }
}
