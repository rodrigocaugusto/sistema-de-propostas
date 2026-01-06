
import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Configure Backblaze S3 Client
const s3Client = new S3Client({
    region: 'us-west-004',
    endpoint: 'https://s3.us-west-004.backblazeb2.com',
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || '0045bee0fafc1f90000000004',
        secretAccessKey: process.env.B2_APPLICATION_KEY || 'K004OvJCt6RxCTg/leNNDAz3PxDNI1Y',
    },
    forcePathStyle: false
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
        const bucketName = process.env.B2_BUCKET_NAME || 'sistema-proposal-dl';

        // Convert File to Stream/Buffer for Upload
        // Note: For large files, stream is better, but arrayBuffer works for 5MB
        // @aws-sdk/lib-storage Upload handles streams/buffers well

        // Since File is Blob, we can use it directly or via buffer
        // Let's use arrayBuffer -> Buffer as standard node approach
        // const bytes = await file.arrayBuffer();
        // const buffer = Buffer.from(bytes);

        // Upload to B2
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: file.stream(), // Direct stream from the request file
                ContentType: file.type,
                // ACL: 'public-read' // Backblaze buckets are private by default, public folders need bucket settings. 
                // If your bucket is public, files are readable. If private, this won't make it public via API alone usually.
            },
        });

        await parallelUploads3.done();

        // Construct Public URL
        // Format: https://<BucketName>.<Endpoint>/<Key>  OR  https://<Endpoint>/file/<BucketName>/<Key>
        // Backblaze Friendly URL: https://<BucketName>.s3.us-west-004.backblazeb2.com/<Key>
        // OR Native URL: https://f004.backblazeb2.com/file/<BucketName>/<Key> (Usually preferred for CDN)

        // Let's use the S3 compatible URL if the bucket is public
        // https://sistema-proposal-dl.s3.us-west-004.backblazeb2.com/logos/filename...

        const publicUrl = `https://${bucketName}.s3.us-west-004.backblazeb2.com/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('B2 Upload error:', error);
        return NextResponse.json(
            { error: 'Erro ao fazer upload do arquivo: ' + error.message },
            { status: 500 }
        );
    }
}
