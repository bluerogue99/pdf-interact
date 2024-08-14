import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loadS3IntoPinecone } from '@/lib/db/pinecone';
import { chats } from '@/lib/db/schema'; 
import { db } from '@/lib/db'; 
import { getS3Url } from '@/lib/db/s3'; 
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const {userId} = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { file_key, file_name } = body;
    console.log(file_key, file_name);
    
    await loadS3IntoPinecone(file_key);
    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });
    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      }, { status: 200 }
    );

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
