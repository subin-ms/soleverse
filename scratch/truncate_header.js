const fs = require('fs');

try {
  let content = fs.readFileSync('c:/soleverse/soleverse/public/user/header.js', 'utf8');

  // Let's just find the last valid block and cut everything after it!
  const block = `// Fallback just in case load event was missed or too fast
if (document.readyState === "complete") {
   document.body.classList.add("loaded");
}`;

  const index1 = content.indexOf('// Fallback just in case load event was missed or too fast\\nif (document.readyState === "complete") {\\n   document.body.classList.add("loaded");\\n}');
  const index2 = content.indexOf('// Fallback just in case load event was missed or too fast\r\nif (document.readyState === "complete") {\r\n   document.body.classList.add("loaded");\r\n}');

  // simpler: match regex
  const regex = /\/\/ Fallback just in case load event was missed or too fast[\s\S]*?document\.body\.classList\.add\("loaded"\);\r?\n\}/;
  
  const match = content.match(regex);
  
  if (match) {
     const endIndex = match.index + match[0].length;
     fs.writeFileSync('c:/soleverse/soleverse/public/user/header.js', content.substring(0, endIndex) + '\n', 'utf8');
     console.log("Truncated successfully");
  } else {
     console.log("Match not found");
  }

} catch (error) {
  console.error(error);
}
