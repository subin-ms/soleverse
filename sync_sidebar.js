const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'public', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));

const messagesLink = `
        <a href="messages.html" class="nav-item">
            <div class="nav-icon"><svg class="icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
            Messages
        </a>`;

files.forEach(file => {
    const fpath = path.join(adminDir, file);
    let content = fs.readFileSync(fpath, 'utf8');
    
    // Check if messages.html already exists in sidebar
    if (content.includes('href="messages.html"')) {
        console.log(`Skipping ${file}, already has Messages link.`);
        return;
    }

    // Try to find the Transactions link to insert after it
    // Look for transactions.html and then the closing </a>
    const transactionsRegex = /(<a href="transactions\.html"[^>]*>[\s\S]*?<\/a>)/;
    
    if (transactionsRegex.test(content)) {
        content = content.replace(transactionsRegex, `$1${messagesLink}`);
        console.log(`Added Messages link to ${file} (after Transactions)`);
        fs.writeFileSync(fpath, content, 'utf8');
    } else {
        // Alternative: find "Main menu" category end
        console.log(`Transactions link not found in ${file}, checking for Main Menu...`);
        const mainMenuRegex = /(<div class="menu-category">Main menu<\/div>[\s\S]*?)(<div class="menu-category">)/;
        if (mainMenuRegex.test(content)) {
            content = content.replace(mainMenuRegex, `$1${messagesLink}$2`);
             console.log(`Added Messages link to ${file} (end of Main Menu)`);
             fs.writeFileSync(fpath, content, 'utf8');
        } else {
            console.warn(`Could not determine insertion point for ${file}`);
        }
    }
});
