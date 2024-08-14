'use client';

import { DrizzleChat } from '@/lib/db/schema';
import Link from 'next/link';
import { Button } from './ui/button';
import { PlusCircle, MessageCircle } from 'lucide-react';
import React, { useState } from 'react';
import clsx from 'clsx';
import axios from 'axios';

type Props = {
    chats: DrizzleChat[],
    chatId: number,
}

const ChatSideBar = ({ chats, chatId }: Props) => {
    const [loading, setLoading] = useState(false);

    const handleSubscription = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/stripe');
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Subscription error:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative w-full h-screen p-4 text-gray-200 bg-gray-900">
            <Link href="/">
                <Button className="w-full border-solid border-white border">
                    Upload New PDF
                    <PlusCircle className="mr-2 w-4 h-4" />
                </Button>
            </Link>
            <div className="flex flex-col gap-2 mt-4">
                {chats.map((chat) => (
                    <Link key={chat.id} href={`/chat/${chat.id}`}>
                        <div
                            className={clsx("rounded-lg text-slate-300 flex items-center p-2", {
                                "bg-blue-600 text-white": chat.id === chatId,
                                "hover:bg-gray-700": chat.id !== chatId,
                            })}
                        >
                            <MessageCircle className="mr-2" />
                            <p className="w-full overflow-hidden text-slate-300 truncate whitespace-nowrap gradiant-text">{chat.pdfName}</p>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                    <Link href="/">Home</Link>
                    <Link href="/">Source</Link>
                </div>
                <Button 
                    className="mt-2 text-white bg-slate-700" 
                    onClick={handleSubscription}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Upgrade to Pro!'}
                </Button>
            </div>
        </div>
    );
}

export default ChatSideBar;
