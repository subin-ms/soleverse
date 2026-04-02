const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else { 
            if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'public'));
let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace standalone $ followed by digits: $100 -> ₹100
    content = content.replace(/\$([0-9]+(?:\.[0-9]+)?)/g, '₹$1');
    
    // Replace template string literals like $${price} -> ₹${price}
    content = content.replace(/\$\$\{/g, '₹${');
    
    // Replace string concatenations: '$' + price -> '₹' + price
    content = content.replace(/'\$'\s*\+/g, "'₹' +");
    content = content.replace(/"\$"\s*\+/g, '"₹" +');
    
    // Replace string concatenations with spaces: '$ ' + price -> '₹ ' + price
    content = content.replace(/'\$\s*'\s*\+/g, "'₹ ' +");
    content = content.replace(/"\$\s*"\s*\+/g, '"₹ " +');

    // Replace text 'Save $3' etc.
    content = content.replace(/Save \$([0-9]+)/gi, 'Save ₹$1');
    
    // Replace $... placeholder
    content = content.replace(/\$\.\.\./g, '₹...');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
        updatedCount++;
    }
});

console.log(`Successfully updated ${updatedCount} files.`);
