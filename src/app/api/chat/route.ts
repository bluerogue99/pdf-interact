import { Configuration, OpenAIApi } from 'openai-edge';
import { getContext } from "@/lib/context";
import { db } from '@/lib/db';
import { chats, messages as _messages } from '@/lib/db/schema'; 
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Message } from 'ai/react';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY!,
});

const openai = new OpenAIApi(config);

export async function POST(req: Request) {
    try {
        const { messages, chatId } = await req.json();
        const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
        if (_chats.length !== 1) {
            return NextResponse.json({ 'error': 'chat not found' }, { status: 404 });
        }
        const fileKey = _chats[0].fileKey;

        const lastMessage = messages[messages.length - 1];
        const textContent = lastMessage?.content || ""; // Extract content if lastMessage is an object

        // onStart: Save the user message into the database
        await db.insert(_messages).values({
            chatId,
            content: textContent,
            role: 'user',
        });

        // Get context based on the user's last message
        const context = await getContext(textContent, fileKey);

        const prompt = {
            role: 'system',
            content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            AI is a well-behaved and well-mannered individual.
            AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
            AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK
            AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
            If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
            AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
            AI assistant will not invent anything that is not drawn directly from the context.`,
        };

        const messagesForOpenAI = [
            prompt,
            ...messages.filter((message: Message) => message.role === 'user'),
        ];

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messagesForOpenAI,
            stream: true,
        });

        let aiResponse = '';

        // Create a new ReadableStream from the response body
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const decodedValue = new TextDecoder().decode(value);
                        aiResponse += decodedValue; // Collect AI's response
                        controller.enqueue(value);
                    }
                }
                controller.close();

                // onCompletion: Save the AI's message into the database
                await db.insert(_messages).values({
                    chatId,
                    content: aiResponse,
                    role: 'system',
                });
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
