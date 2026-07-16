const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Regex patterns
const LOCALHOST_REGEX = /localhost/gi;
const IP_127_0_0_1_REGEX = /127\.0\.0\.1/g;
const PRIVATE_IP_REGEX = /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g;
const ONRENDER_REGEX = /onrender\.com/gi;
const VERCEL_APP_REGEX = /vercel\.app/gi;

// Asset Reference Regexes for HTML
const HTML_ASSETS = [
    { tag: 'link stylesheet', regex: /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi },
    { tag: 'script', regex: /<script[^>]+src=["']([^"']+)["']/gi },
    { tag: 'img', regex: /<img[^>]+src=["']([^"']+)["']/gi },
    { tag: 'video', regex: /<video[^>]+src=["']([^"']+)["']/gi },
    { tag: 'source', regex: /<source[^>]+src=["']([^"']+)["']/gi }
];

// CSS url() regex
const CSS_URL_REGEX = /url\(['"]?([^'")]+)['"]?\)/gi;

let totalFiles = 0;
let errors = 0;
let warnings = 0;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

console.log('==================================================');
console.log('          SOLEVERSE FRONTEND PRODUCTION AUDIT     ');
console.log('==================================================\n');

walkDir(FRONTEND_DIR, (filePath) => {
    const relPath = path.relative(FRONTEND_DIR, filePath);
    // Skip node_modules or .git if present (should not be in frontend anyway, but just in case)
    if (relPath.includes('node_modules') || relPath.startsWith('.')) return;

    totalFiles++;
    const content = fs.readFileSync(filePath, 'utf8');
    const isHtml = filePath.endsWith('.html');
    const isJs = filePath.endsWith('.js');
    const isCss = filePath.endsWith('.css');
    
    let fileHasIssues = false;

    function report(type, msg, lineNum) {
        if (!fileHasIssues) {
            console.log(`\n📄 File: frontend/${relPath.replace(/\\/g, '/')}`);
            fileHasIssues = true;
        }
        const prefix = type === 'ERROR' ? '❌ ERROR' : '⚠️ WARNING';
        if (type === 'ERROR') errors++;
        else warnings++;
        console.log(`   [${prefix}] Line ${lineNum || 'N/A'}: ${msg}`);
    }

    // 1. IP & Hostname Checks
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Localhost
        if (line.match(LOCALHOST_REGEX)) {
            report('ERROR', `Found reference to 'localhost': "${line.trim()}"`, lineNum);
        }
        // 127.0.0.1
        if (line.match(IP_127_0_0_1_REGEX)) {
            report('ERROR', `Found reference to '127.0.0.1': "${line.trim()}"`, lineNum);
        }
        // Private IP
        const privateIpMatches = line.match(PRIVATE_IP_REGEX);
        if (privateIpMatches) {
            report('ERROR', `Found reference to private IP address (${privateIpMatches.join(', ')}): "${line.trim()}"`, lineNum);
        }
        // onrender.com (except inside frontend/js/config.js)
        if (line.match(ONRENDER_REGEX) && relPath.replace(/\\/g, '/') !== 'js/config.js') {
            report('ERROR', `Found hardcoded 'onrender.com' domain: "${line.trim()}"`, lineNum);
        }
        // vercel.app used for API or hardcoded backend/endpoints
        const vercelMatches = line.match(VERCEL_APP_REGEX);
        if (vercelMatches) {
            // Flag if vercel.app is used in API requests or fetches
            if (line.includes('fetch') || line.includes('API') || line.includes('url') || line.includes('http')) {
                report('WARNING', `Found vercel.app reference: "${line.trim()}"`, lineNum);
            }
        }

        // 2. Fetch API check (does it use API_BASE?)
        // Let's inspect fetch calls
        let match;
        const fetchRegex = /fetch\s*\(\s*([^,)]+)/g;
        while ((match = fetchRegex.exec(line)) !== null) {
            const param = match[1].trim();
            // Allow parameter that begins with API_BASE, local filenames, or constants
            const isAllowed = param.includes('API_BASE') || 
                              param.includes('WISHLIST_API') || 
                              param.includes('CART_API') || 
                              param.includes('ORDERS_API') || 
                              param.includes('AUTH_API') || 
                              param.includes('_local_api_base') || 
                              param.startsWith('"header.html"') || 
                              param.startsWith("'header.html'") || 
                              param.startsWith('`header.html`') || 
                              param.startsWith('url') ||
                              param.startsWith('href');
            if (!isAllowed) {
                report('WARNING', `Fetch call parameter "${param}" might not be using API_BASE: "${line.trim()}"`, lineNum);
            }
        }

        // 3. Image URL Resolution Checks
        // Scan for references to products/categories/offers image fields (like .image, imagePath, etc.)
        // We want to make sure it doesn't just render absolute paths directly like `/uploads/...` without resolving them via API_BASE
        if (isJs || isHtml) {
            const imgPathChecks = [
                /\.image\b/g,
                /imagePath\b/g
            ];
            let hasImageReference = imgPathChecks.some(regex => line.match(regex));
            if (hasImageReference) {
                // If it contains "uploads" or image reference, let's verify if API_BASE.replace('/api', '') is applied
                if (line.includes('uploads') || line.includes('item.product.image') || line.includes('p.image') || line.includes('product.image')) {
                    const hasApiBaseReplace = line.includes("API_BASE.replace('/api'") || 
                                              line.includes('API_BASE.replace("/api"') || 
                                              line.includes("API_BASE.replace(/\\/api/g") || 
                                              line.includes("img.startsWith('http')") || 
                                              line.includes("imgSrc.startsWith('http')") || 
                                              line.includes("imgPath.startsWith('http')") ||
                                              line.includes("img.startsWith('/uploads')") ||
                                              line.includes("imgSrc.startsWith('/uploads')") ||
                                              line.includes("imgPath.startsWith('/uploads')") ||
                                              line.includes("placeholder");
                    if (!hasApiBaseReplace && !line.includes('//') && !line.includes('API_BASE') && !line.includes('WISHLIST_API')) {
                        report('WARNING', `Image URL construction may be missing API_BASE conversion: "${line.trim()}"`, lineNum);
                    }
                }
            }
        }
    });

    // 4. Local Asset Check (Existence check)
    // Parse assets from HTML files
    if (isHtml) {
        HTML_ASSETS.forEach(({ tag, regex }) => {
            let match;
            // Reset regex state
            regex.lastIndex = 0;
            while ((match = regex.exec(content)) !== null) {
                const assetPath = match[1].trim();
                checkLocalAsset(assetPath, filePath, tag, report);
            }
        });
    }

    // Parse assets from CSS files
    if (isCss) {
        let match;
        CSS_URL_REGEX.lastIndex = 0;
        while ((match = CSS_URL_REGEX.exec(content)) !== null) {
            const assetPath = match[1].trim();
            checkLocalAsset(assetPath, filePath, 'css-url', report);
        }
    }
});

function checkLocalAsset(assetPath, sourceFilePath, tag, report) {
    // Ignore external URLs, variables, templates, or data-URIs
    if (assetPath.startsWith('http://') || 
        assetPath.startsWith('https://') || 
        assetPath.startsWith('//') || 
        assetPath.startsWith('data:') || 
        assetPath.startsWith('${') || 
        assetPath.includes('{{') || 
        assetPath.startsWith('#') ||
        assetPath === 'N/A' ||
        assetPath === '') {
        return;
    }

    // Ignore dynamic variables (e.g. ending in .js inside JS strings, or having templated values)
    if (assetPath.includes('+') || assetPath.includes('`')) {
        return;
    }

    // Remove any query string or hash (like styles.css?v=1.2 or font.woff2#iefix)
    const cleanPath = assetPath.split('?')[0].split('#')[0];

    // Resolve relative path to the source file directory
    const sourceDir = path.dirname(sourceFilePath);
    let resolvedPath = path.resolve(sourceDir, cleanPath);

    // Make sure it remains inside the frontend directory, or public or other accessible path
    if (!fs.existsSync(resolvedPath)) {
        // Let's also check relative to the frontend root directory in case it's an absolute-looking path like /css/...
        if (cleanPath.startsWith('/')) {
            const rootResolvedPath = path.join(FRONTEND_DIR, cleanPath);
            if (fs.existsSync(rootResolvedPath)) {
                return;
            }
        }
        report('ERROR', `Missing local asset referenced via ${tag}: "${assetPath}" (Resolved to: ${resolvedPath})`);
    }
}

console.log('\n==================================================');
console.log(`Scan complete. Scanned ${totalFiles} files.`);
console.log(`Total Errors: ${errors}`);
console.log(`Total Warnings: ${warnings}`);
console.log('==================================================\n');

if (errors > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
