import OpenAI, { toFile } from 'openai';

interface Options {
  threadId: string;
  question: string;
  fileContent?: Buffer;
  fileName?: string;
}

export const createMessageUseCase = async (openai: OpenAI, options: Options) => {
  const { threadId, question, fileContent, fileName } = options;

  if (fileContent && fileName) {
    const file = await openai.files.create({
      file: await toFile(fileContent, fileName),
      purpose: 'vision'
    })


    return await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: [
        { type: 'image_file', image_file: { file_id: file.id } },
        { type: 'text', text: question }
      ],
    })
  }
  
  const message = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: question
  });

  return message;
};