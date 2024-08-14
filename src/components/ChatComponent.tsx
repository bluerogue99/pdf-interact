'use client';

import React, { useState, useCallback } from 'react';
import { Input } from './ui/input';
import { Message, useChat } from 'ai/react';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import MessageList from './MessageList';
import './ChatComponent.css';

type ChatRole = 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';

type Props = {chatId: number}; 

interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
}

const ChatComponent = ({chatId}: Props) => {
    const {data} = useQuery ({
        queryKey: ["chat", chatId],
        queryFn: async () => {
            const response = await axios.post<Message[]>('/api/get-messages', {chatId})
            return response.data;
        }
    })

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');

    const { handleInputChange, handleSubmit } = useChat({
        api: '/api/chat',
        body: {
            chatId,
        },
        initialMessages:data || [],
        onResponse: (response) => {
            console.log('Received response:', response);
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const processText = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
                if (done) {
                    // End of stream: process final accumulated buffer
                    if (buffer) {
                        // Extract and set the final content message
                        const content = extractContent(buffer);
                        if (content) {
                            setMessages((prevMessages) => [
                                ...prevMessages,
                                { id: Date.now().toString(), role: 'assistant', content: content }
                            ]);
                        }
                    }
                    return;
                }

                // Decode the Uint8Array to a string and append to buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Continue reading the stream
                return reader ? reader.read().then(processText) : Promise.resolve();
            };

            if (reader) {
                reader.read().then(processText).catch((error) => console.error('Stream reading error:', error));
            }
        }
    });

    const handleInputChangeInternal = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        handleInputChange(e); // Call the original handleInputChange from useChat
    }, [handleInputChange]);

    const handleSubmitInternal = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (input.trim()) {
            handleSubmit(e);
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: Date.now().toString(), role: 'user', content: input }
            ]);
            setInput('');
        }
    }, [handleSubmit, input]);

    // Function to extract content from the buffer
    const extractContent = (buffer: string): string | null => {
        try {
            const lines = buffer.split('\n').filter(line => line.startsWith('data: '));
            let content = '';
    
            lines.forEach(line => {
                if (line.trim() === 'data: [DONE]') return; // Skip [DONE] line
    
                try {
                    const json = JSON.parse(line.substring(5)); // Remove 'data: ' prefix
                    const chunkContent = json.choices[0]?.delta?.content || '';
                    if (chunkContent) {
                        content += chunkContent; // Accumulate content
                    }
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                }
            });
    
            return content.trim() || null; // Return content or null if empty
        } catch (error) {
            console.error('Failed to extract content:', error);
            return null;
        }
    };

    React.useEffect(()=>{
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.scrollTo({
                top:messageContainer.scrollHeight, 
                behavior: "smooth",
            });
        }
    }, [messages]);
    
    return (
        <div className="relative max-h-screen overflow-scroll flex flex-col" id="message-container">
            <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
                <h3 className="text-xl font-bold">Chat</h3>
                <h5 className="text-m">Interact with the PDF below:</h5>
            </div>
            <div className="flex-grow overflow-auto">
                <MessageList messages={messages} />
            </div>
            <form onSubmit={handleSubmitInternal} className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white flex items-center">
                <Input
                    value={input}
                    onChange={handleInputChangeInternal}
                    placeholder="Ask any question..."
                    className="flex-grow"
                />
                <Button type="submit" className="bg-blue-600 ml-2">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
};

export default ChatComponent;