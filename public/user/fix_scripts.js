const fs = require('fs');
const path = require('path');
const dir = 'c:\\Users\\LENOVO\\OneDrive\\Desktop\\wwwq - Copy (2)\\public\\user';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove null bytes
    content = content.replace(/\0/g, ''); 
    
    let modified = false;

    // Check if footer.js is included
    if (!content.includes('src="footer.js"') && !content.includes("src='footer.js'")) {
        // Inject right before </body> or at the end of scripts
        content = content.replace(/<\/body>/i, '    <script src="footer.js"></script>\n</body>');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Injected footer.js into ${file}`);
    }
});
