import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'danzj0tr5',
    api_key: process.env.CLOUDINARY_API_KEY || '49646691182694',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'RQdKDFkm5bCnrqWVY_wUgtDyiHg',
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on file type or you can customize
        return {
            folder: 'novas-ecommerce',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        };
    },
});

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', { storage }))
    uploadFile(@UploadedFile() file: Express.Multer.File & { path?: string }) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        console.log('[UploadController] File uploaded to Cloudinary:', file.path);
        return {
            url: file.path, // Cloudinary full URL
            filename: file.filename,
            originalname: file.originalname,
        };
    }

    @Post('multiple')
    @UseInterceptors(FilesInterceptor('files', 10, { storage }))
    uploadFiles(@UploadedFiles() files: (Express.Multer.File & { path?: string })[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }
        console.log('[UploadController] Multiple files uploaded to Cloudinary');
        return files.map(file => ({
            url: file.path, // Cloudinary full URL
            filename: file.filename,
            originalname: file.originalname,
        }));
    }
}
