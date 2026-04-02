const fs = require('fs');
const path = require('path');
const dir = 'c:\\Users\\LENOVO\\OneDrive\\Desktop\\wwwq - Copy (2)\\public\\user';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove null bytes caused by PowerShell UTF-16LE corruption
    content = content.replace(/\0/g, ''); 
    
    let modified = false;

    // Check if footer.css is included correctly
    if (!content.includes('href="footer.css"') && !content.includes("href='footer.css'")) {
        content = content.replace(/<\/head>/i, '    <link rel="stylesheet" href="footer.css">\n</head>');
        modified = true;
    }
    
    // Check if FontAwesome is included
    if (!content.includes('font-awesome')) {
        content = content.replace(/<\/head>/i, '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">\n</head>');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
