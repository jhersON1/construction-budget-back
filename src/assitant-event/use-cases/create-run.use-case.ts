import OpenAI from 'openai';

interface Options {
  threadId: string;
  assistantId?: string;
}

export const createRunUseCase = async (openai: OpenAI, options: Options) => {
  const { threadId, assistantId = process.env.ASSISTANT_EVENT_ID } = options;

  if (!assistantId) {
    throw new Error('Assistant ID is required');
  }

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });

  return run;
};