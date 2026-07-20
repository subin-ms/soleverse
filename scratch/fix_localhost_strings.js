const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000/api')) {
                content = content.replace(/http:\/\/localhost:5000\/api/g, '/api');
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, '../public/admin'));
replaceInDir(path.join(__dirname, '../public/user'));
console.log('Done replacing localhost strings in public directories.');
