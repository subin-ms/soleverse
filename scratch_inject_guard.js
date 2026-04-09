const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'admin');

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove any existing admin-guard script tag
        content = content.replace(/<script src="admin-guard\.js"><\/script>\n?/g, '');
        
        // Add it right after <head>
        content = content.replace(/<head>/, '<head>\n    <script src="admin-guard.js"></script>');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
