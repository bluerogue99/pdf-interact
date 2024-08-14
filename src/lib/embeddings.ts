import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text.replace(/\n/g, ' ')
        });
        return response.data[0].embedding as number[];
    } catch (error) {
        console.error('Error calling OpenAI embeddings API:', error);
        throw error;
    }
}
