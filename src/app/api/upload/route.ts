
import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(request: NextRequest) {
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

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo permitido: 5MB' },
                { status: 400 }
            );
        }

        // Create unique filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `logos/${timestamp}_${cleanName}`;
        const bucketName = process.env.AWS_BUCKET_NAME || 'randhost';

        if (!bucketName) {
            throw new Error("AWS_BUCKET_NAME is not defined");
        }

        // Upload to S3
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: file.stream(),
                ContentType: file.type,
                // ACL: 'public-read' // Uncomment if your bucket is public and requires explicit ACL
            },
        });

        await parallelUploads3.done();

        // Construct Public URL
        // Standard AWS S3 URL format: https://<BucketName>.s3.<Region>.amazonaws.com/<Key>
        const region = process.env.AWS_REGION || 'us-east-1';
        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('S3 Upload error:', error);
        return NextResponse.json(
            { error: 'Erro ao fazer upload do arquivo: ' + error.message },
            { status: 500 }
        );
    }
}
