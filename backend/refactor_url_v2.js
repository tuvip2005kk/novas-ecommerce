const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
                walkDir(dirPath, callback);
            }
        } else {
            if (f.endsWith('.tsx') || f.endsWith('.ts')) {
                callback(dirPath);
            }
        }
    });
}

walkDir(frontendDir, (filePath) => {
    // Skip config file
    if (filePath.endsWith('config.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChange = false;

    // Helper to calculate relative path to config
    // We can just use absolute alias if configured, but let's stick to simple relative or try usage of @/config if tsconfig supports it.
    // The previous checks showed tsconfig has "@/*": ["./*"]. So "@/config" should work if config.ts is in frontend root.
    // config.ts was created at f:/do an/frontend/config.ts.
    // So import { API_URL } from '@/config'; should work.

    const importStatement = "import { API_URL } from '@/config';";

    // 1. Check for usages of API_URL without import (fix potential previous messy edits)
    if (content.includes('API_URL') && !content.includes('import { API_URL }') && !content.includes('const API_URL =')) {
        if (content.includes("'use client'") || content.includes('"use client"')) {
            content = content.replace(/(['"]use client['"];?)/, '$1\n' + importStatement);
        } else {
            content = importStatement + '\n' + content;
        }
        hasChange = true;
    }

    // 2. Replace hardcoded URLs
    if (content.includes('http://localhost:3005')) {
        // Add import if not present and we are about to use API_URL
        if (!content.includes('import { API_URL }')) {
            if (content.includes("'use client'") || content.includes('"use client"')) {
                content = content.replace(/(['"]use client['"];?)/, '$1\n' + importStatement);
            } else {
                content = importStatement + '\n' + content;
            }
        }

        // Replace backtick template literals
        // Matches `...http://localhost:3005...`
        content = content.replace(/(`[^`]*)http:\/\/localhost:3005([^`]*`)/g, '$1${API_URL}$2');

        // Replace single quoted strings
        // 'http://localhost:3005/api' -> `${API_URL}/api`
        content = content.replace(/'http:\/\/localhost:3005([^']*)'/g, '`${API_URL}$1`');

        // Replace double quoted strings
        // "http://localhost:3005/api" -> `${API_URL}/api`
        content = content.replace(/"http:\/\/localhost:3005([^"]*)"/g, '`${API_URL}$1`');

        hasChange = true;
    }

    if (hasChange && content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
