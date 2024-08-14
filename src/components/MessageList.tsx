import React from 'react';
import clsx from 'clsx'; // Assuming you're using clsx for conditional class names
import { Message } from 'ai/react';

type Props = {
    messages: Message[]; 
};

const MessageList = ({ messages }: Props) => {
    if (!messages) return null;
    
    return (
    <div className="flex flex-col gap-2 px-4" style={{ marginBottom: '20px' }}>
    {messages.map((message) => (
        <div key={message.id} className={clsx('flex', {
                'justify-end pl-10': message.role === 'user',
                'justify-start pr-10': message.role === 'assistant'
            })}
        >
            <div className={clsx('rounded-lg px-3 py-1 shadow-md ring-1 ring-gray-900/10', {
                'bg-blue-600 text-white': message.role === 'user',
            })}>
                <span>{message.content}</span>
            </div>
        </div>
    ))}
        </div>
    );
};

export default MessageList;