"use strict";
import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const storage = diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', { storage }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return {
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalname: file.originalname,
        };
    }

    @Post('multiple')
    @UseInterceptors(FilesInterceptor('files', 10, { storage }))
    uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }
        return files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalname: file.originalname,
        }));
    }
}
