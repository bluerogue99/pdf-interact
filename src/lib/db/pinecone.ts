import { Pinecone } from '@pinecone-database/pinecone';
import { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/data';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document as DocSplitterDocument, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';
import md5 from 'md5';
import { convertToAscii } from '../utils';  
import { getEmbeddings } from '../embeddings';

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return pinecone;
};

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number }
    }
};

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. Load the PDF - download from server and read it.
    console.log('Downloading S3 into file system');
    const file_name = await downloadFromS3(fileKey);
    console.log(file_name);
    if (!file_name) {
        throw new Error('Could not download from S3');
    }
    const loader = new PDFLoader(file_name);
    const pages = await loader.load() as PDFPage[]; // Ensure pages are of type PDFPage

    // 2. Split PDF into smaller readable chunks
    const documentArrays = await Promise.all(pages.map(page => prepareDocument(page)));
    const documents = documentArrays.flat(); // Flatten the array of arrays
    
    // 3. Vectorize and embed individual documents
    const vectors = await Promise.all(documents.map(embedDocument));

    // 4. Upload to Pinecone
    const client = await getPineconeClient();
    const pineconeIndex = client.index('smartracoon'); 

    console.log('Inserting vectors into Pinecone');
    const namespace = convertToAscii(fileKey);

    // Manually handle chunking if needed
    const chunkSize = 10;
    for (let i = 0; i < vectors.length; i += chunkSize) {
        const chunk = vectors.slice(i, i + chunkSize);
        await pineconeIndex.namespace(namespace).upsert(chunk as any);  // Insert vectors into Pinecone
    }

    return documents;
}

async function embedDocument(doc: DocSplitterDocument): Promise<Vector> {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            } as Record<string, string | number | boolean> // Ensure metadata is properly typed
        } as Vector;
    } catch (error) {
        console.log('Error embedding document', error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, bytes: number): string => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage): Promise<DocSplitterDocument[]> {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, '');

    // Split docs
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new DocSplitterDocument({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ]);

    return docs;
}
