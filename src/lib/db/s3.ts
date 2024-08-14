import AWS from 'aws-sdk';

export async function uploadToS3(file: File) {
    try {
        // Initialize S3 client
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID, 
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY, 
        });

        const s3 = new AWS.S3({
            region: 'eu-north-1',
        });

        // Generate a unique file key
        const file_key = 'uploads/' + Date.now().toString() + file.name.replace(/ /g, '-');
        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file,
            ContentType: file.type,
        };

        // Upload the file
        const upload = s3.putObject(params).promise();

        await upload;

        console.log('Successfully uploaded to S3!', file_key);

        return {
            file_key,
            file_name: file.name,
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
}

export function getS3Url(file_key: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`;
    return url;
}
