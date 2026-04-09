const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'public', 'user');

fs.readdir(directory, (err, files) => {
    if (err) {
        return console.error("Could not list the directory.", err);
    }

    files.forEach(file => {
        if (file.endsWith('.html') && file !== 'header.html') {
            const filepath = path.join(directory, file);
            let content = fs.readFileSync(filepath, 'utf8');

            // Regular expression to match from the top bar to the end of the header.
            // This catches both literal "<!-- Top Bar -->" comments and just the div itself
            const pattern = /(?:<!--\s*Top Bar\s*-->\s*)?<div class=["']top-bar["'][\s\S]*?<\/header>/g;

            if (pattern.test(content)) {
                const newContent = content.replace(pattern, '<div id="global-header"></div>');
                fs.writeFileSync(filepath, newContent, 'utf8');
                console.log(`Replaced header in ${file}`);
            } else {
                console.log(`No header found in ${file}`);
            }
        }
    });
});
