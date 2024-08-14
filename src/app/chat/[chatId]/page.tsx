import { chats, messages } from '@/lib/db/schema'; // Import the messages schema
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from "react";
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import ChatSideBar from '@/components/ChatSidebar';
import PDFViewer from '@/components/PDFViewer';
import ChatComponent from '@/components/ChatComponent';

type Props = {
    params: {
        chatId: string;
    }
};

const ChatPage = async ({ params: { chatId } }: Props) => {
    const { userId } = auth();
    
    if (!userId) {
        return redirect('/sign-in');
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

    if (!Array.isArray(_chats) || !_chats.length) {
        return redirect('/');
    }

    const chatIdNum = parseInt(chatId, 10);

    if (isNaN(chatIdNum) || !_chats.find(chat => chat.id === chatIdNum)) {
        return redirect('/');
    }

    const currentChat = _chats.find(chat => chat.id === chatIdNum);

    // Fetch messages for the current chat
    const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chatIdNum));

    return (
        <div className="flex max-h-screen overflow-scroll">
            <div className="flex w-full max-h-screen overflow-scroll">
                {/* Chat Sidebar */}
                <div className="flex-[1] max-w-xs">
                    <ChatSideBar chats={_chats} chatId={chatIdNum} />
                </div>
                {/* PDF Viewer */}
                <div className="flex-[5] max-h-screen p-4 overflow-scroll">
                    <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
                </div>
                {/* Chat Component */}
                <div className="flex-[3] border-2 border-slate-200">
                    <ChatComponent chatId={parseInt(chatId)}/>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
