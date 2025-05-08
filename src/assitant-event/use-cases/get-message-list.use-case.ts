import OpenAI from 'openai';

interface Options {
  threadId: string;
}

export const getMessageListUseCase = async (
  openai: OpenAI,
  options: Options
) => {
  const { threadId } = options;
  const messageList = await openai.beta.threads.messages.list(threadId);

  const messages = messageList.data.map(message => ({
    role: message.role,
    // Aquí procesamos cada “part” del contenido, que puede ser texto o imagen
    content: message.content.map(part => {
      // bloque de texto
      if ((part as any).text) {
        return (part as any).text.value;
      }
      // bloque de imagen
      if ((part as any).image_file) {
        // Devolvemos el file_id para que el cliente luego lo recupere
        return {
          type: 'image',
          fileId: (part as any).image_file.file_id
        };
      }
      // cualquier otro tipo (p.ej. embeds futuros)
      return null;
    }).filter(x => x !== null) // eliminamos nulos por seguridad
  }));

  return messages.reverse();
};
