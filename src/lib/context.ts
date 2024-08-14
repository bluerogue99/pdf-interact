import { Pinecone } from "@pinecone-database/pinecone"; 
import { convertToAscii } from "./utils";
import { getEmbeddings } from './embeddings';

// Create and configure Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!, 
});

// Function to get matches from embeddings
export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    const index = pinecone.Index('smartracoon');
    try {
        const namespace = convertToAscii(fileKey);

        // Set the namespace on the index before querying
        const queryResult = await index.namespace(namespace).query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
        });

        return queryResult.matches || [];
    } catch (error) {
        console.error('Error querying embeddings:', error);
        throw error;
    }
}

// Function to get context from a query and file key
export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    const qualifyingDocs = matches.filter(
        (match) => match.score && match.score > 0.7
    );

    type Metadata = {
        text: string;
        pageNumber: number;
    };

    let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);
    return docs.join('\n').substring(0, 3000);
}
