import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Check if S3 is configured
const isS3Configured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME);

// Configure AWS S3 Client
const credentials = isS3Configured
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
    : undefined;

const s3Client = isS3Configured ? new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials,
}) : null;

export async function POST(request: NextRequest) {
    console.log('Starting upload...');
    console.log('S3 Configured:', isS3Configured);

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Nenhum arquivo enviado' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de arquivo não suportado. Use PNG, JPEG, GIF, WebP ou SVG.' },
                { status: 400 }
            );
        }

        // Validate file size (max 25MB)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo permitido: 25MB' },
                { status: 400 }
            );
        }

        // Convert to WebP using sharp if it's an image (excluding SVG)
        let processedBuffer: Buffer;
        let contentType = file.type;
        let extension = file.name.split('.').pop();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type !== 'image/svg+xml') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const sharp = require('sharp');
                processedBuffer = await sharp(buffer)
                    .webp({ quality: 80 })
                    .toBuffer();
                contentType = 'image/webp';
                extension = 'webp';
            } catch (e) {
                console.warn("Sharp processing failed or not available:", e);
                processedBuffer = buffer;
            }
        } else {
            processedBuffer = buffer;
        }

        // Create unique filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, "");
        const fileName = `${timestamp}_${cleanName}.${extension}`;

        // If S3 is configured, upload to S3
        if (isS3Configured && s3Client) {
            const bucketName = process.env.AWS_BUCKET_NAME!;
            const s3Key = `uploads/${fileName}`;

            const parallelUploads3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucketName,
                    Key: s3Key,
                    Body: processedBuffer,
                    ContentType: contentType,
                },
            });

            await parallelUploads3.done();

            // Construct Public URL
            const region = process.env.AWS_REGION || 'us-east-1';
            let publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

            if (process.env.AWS_ENDPOINT && process.env.AWS_ENDPOINT.includes('backblazeb2.com')) {
                const endpointClean = process.env.AWS_ENDPOINT.replace(/^https?:\/\//, '');
                publicUrl = `https://${bucketName}.${endpointClean}/${s3Key}`;
            }

            return NextResponse.json({
                success: true,
                url: publicUrl,
                fileName: s3Key
            });
        }

        // FALLBACK: Save to local filesystem
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, processedBuffer);

        // Return public URL
        const publicUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Erro ao fazer upload do arquivo: ' + error.message },
            { status: 500 }
        );
    }
}
