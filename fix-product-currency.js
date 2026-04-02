const fs = require('fs');
const content = fs.readFileSync('public/user/product.html', 'utf8');
const updatedContent = content.replace(/\$([0-9\.]+)/g, '₹$1')
                               .replace(/'\$'/g, "'₹'")
                               .replace(/"\$"/g, '"₹"')
                               .replace(/\$\.\.\./g, '₹...');
fs.writeFileSync('public/user/product.html', updatedContent);
console.log('product.html updated');
