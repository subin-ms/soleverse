const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'public', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const fpath = path.join(adminDir, file);
    let content = fs.readFileSync(fpath, 'utf8');
    let changed = false;

    // 1. Replace adminToken with token in localStorage lookups
    if (content.includes('adminToken')) {
        content = content.replace(/adminToken/g, 'token');
        changed = true;
    }

    // 2. Remove inline onclick logout logic from logout-btn
    // Pattern: onclick="localStorage.removeItem('...'); window.location.href='...';"
    const logoutBtnRegex = /(<button[^>]*class="logout-btn"[^>]*)onclick="[^"]*"/g;
    if (logoutBtnRegex.test(content)) {
        content = content.replace(logoutBtnRegex, '$1');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(fpath, content, 'utf8');
        console.log(`Cleaned up ${file}`);
    }
});
