const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern 1: if (imgSrc.startsWith('/uploads')) { imgSrc = `${API_BASE.replace('/api', '')}${imgSrc}`; }
    content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.startsWith\(['"`]\/uploads['"`]\)\s*\)\s*\{\s*\1\s*=\s*`\$\{API_BASE\.replace\('\/api',\s*''\)\}\$\{\1\}`;\s*\}/g, 
        `if ($1.startsWith('/uploads')) {
            $1 = \`\${API_BASE.replace('/api', '')}\${$1}\`;
        } else if ($1.startsWith('/')) {
            $1 = \`\${API_BASE.replace('/api', '')}\${$1}\`;
        }`);

    // Pattern 2: `${API_BASE.replace('/api', '')}${cat.image}` where it is inside an expression.
    // Instead of complex regex, let's just make a global replace function that wraps it in a helper function or ternary if it's simple enough.
    // For template literals: `${API_BASE.replace('/api', '')}${var}` -> `${var.startsWith('http') ? var : API_BASE.replace('/api', '') + var}`
    
    // Actually, the simplest and most robust way without breaking HTML syntax is:
    // Replace `${API_BASE.replace('/api', '')}${something}` with `${something.startsWith('http') ? something : API_BASE.replace('/api', '') + something}`
    content = content.replace(/\$\{API_BASE\.replace\('\/api',\s*''\)\}\$\{([a-zA-Z0-9_\.]+)\}/g, 
        `\${$1 && $1.startsWith('http') ? $1 : API_BASE.replace('/api', '') + $1}`);

    // For cancellation-details.html where I accidentally nested:
    content = content.replace(/if\s*\(\!imgPath\.startsWith\('http'\)\)\s*\{\s*if\s*\(imgPath\.startsWith\('http'\)\)\s*\{\s*\/\/\s*Already\s*absolute\s*\(Cloudinary\)\s*\}\s*else\s*\{\s*imgPath\s*=\s*imgPath\.startsWith\('\/'\)\s*\?\s*`\$\{API_BASE\.replace\('\/api',\s*''\)\}\$\{imgPath\}`\s*:\s*`\$\{API_BASE\.replace\('\/api',\s*''\)\}\/\$\{imgPath\.replace\(\/\\\\\\\\\/g,\s*'\/'\)\}`;\s*\}\s*\}/g,
        `if (!imgPath.startsWith('http')) {
                    imgPath = imgPath.startsWith('/') ? \`\${API_BASE.replace('/api', '')}\${imgPath}\` : \`\${API_BASE.replace('/api', '')}/\${imgPath.replace(/\\\\/g, '/')}\`;
                }`);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

traverseDir(frontendDir);
console.log('Refactoring complete.');
