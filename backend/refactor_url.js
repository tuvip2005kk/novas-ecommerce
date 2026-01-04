const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function walkDir(dir, callback) {
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
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChange = false;

    // 1. Check for usages of API_URL without import (fix my previous messy edits)
    if (content.includes('API_URL') && !content.includes('import { API_URL }') && !filePath.includes('config.ts')) {
        // Add import
        if (content.includes("'use client'") || content.includes('"use client"')) {
            content = content.replace(/(['"]use client['"];?)/, '$1\nimport { API_URL } from "@/config";');
        } else {
            content = 'import { API_URL } from "@/config";\n' + content;
        }
        hasChange = true;
    }

    // 2. Replace hardcoded URLs
    if (content.includes('http://localhost:3005')) {
        // Add import if not present
        if (!content.includes('import { API_URL }')) {
            if (content.includes("'use client'") || content.includes('"use client"')) {
                content = content.replace(/(['"]use client['"];?)/, '$1\nimport { API_URL } from "@/config";');
            } else {
                content = 'import { API_URL } from "@/config";\n' + content;
            }
        }

        // Replace backtick template literals
        // Matches `...http://localhost:3005...`
        // We replace "http://localhost:3005" with "${API_URL}" if it is inside backticks.
        // Naive check: if line has backticks? No, regex replacement is better.
        // We assume we can safely replace http://localhost:3005 with ${API_URL} inside backticks.
        // But simply replacing the string works if we ensure the context.
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
