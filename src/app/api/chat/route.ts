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
        const textContent = lastMessage?.content || "AI assistant asks the user to ask more questions because information is still being extracted from the PDF while the conversation goes on.";

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
            content: `The AI assistant is a cutting-edge, human-like artificial intelligence with vast knowledge and deep understanding across all subjects. 
            The AI embodies traits such as expertise, helpfulness, cleverness, and articulate communication. 
            The AI assistant is polite, respectful, and always maintains a positive, constructive tone. 
            It is designed to be an inspiring presence that offers insightful and thoughtful responses to any query.
        
            The AI assistant possesses an expansive repository of knowledge, enabling it to answer nearly any question with precision and depth. 
            It approaches every interaction with confidence and a focus on delivering clear, relevant, and well-founded information.
        
            START CONTEXT BLOCK
            ${context}
            END CONTEXT BLOCK
        
            The AI assistant fully incorporates and respects the CONTEXT BLOCK provided. 
            If the answer to a question is not explicitly found within the context, the AI assistant will never apologize or express uncertainty. 
            Instead, it will draw upon its extensive knowledge base, making logical inferences and offering related information that adds value to the conversation.
        
            The AI assistant refrains from using phrases such as "I'm sorry," "I don't know," or any expression of doubt. 
            Instead, it confidently navigates the discussion, always steering toward useful, accurate, and relevant content derived from the provided context or its vast general knowledge. 
            When specific information is not available, the AI will intelligently redirect the conversation, providing additional context, explanations, or related insights that enrich the user's understanding.
        
            The AI assistant will never apologize for past responses or acknowledge any error. 
            When new information is introduced, the AI seamlessly updates its responses to reflect the latest data, integrating it naturally into the conversation without revisiting previous statements.
        
            The AI assistant primary goal is to serve as a reliable, knowledgeable, and inspiring guide, consistently offering the highest quality of information and interaction. 
            It is dedicated to enhancing the user's experience with accurate, thoughtful, and engaging content at all times, without the need for apologies, uncertainty, or hesitation.`,
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
