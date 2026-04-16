const fs = require('fs');

try {
  let content = fs.readFileSync('c:/soleverse/soleverse/public/user/header.js', 'utf8');
  
  // Find the valid end of the code. We know it ends with:
  // if (document.readyState === "complete") {
  //    document.body.classList.add("loaded");
  // }
  
  const markerIndex = content.lastIndexOf('document.body.classList.add("loaded");\r\n}');
  if (markerIndex === -1) {
      const altMarkerIndex = content.lastIndexOf('document.body.classList.add("loaded");\n}');
      if (altMarkerIndex !== -1) {
         content = content.substring(0, altMarkerIndex + 'document.body.classList.add("loaded");\n}'.length);
      }
  } else {
      content = content.substring(0, markerIndex + 'document.body.classList.add("loaded");\r\n}'.length);
  }

  fs.writeFileSync('c:/soleverse/soleverse/public/user/header.js', content, 'utf8');
  console.log("Successfully cleaned up header.js");
} catch (error) {
  console.error(error);
}
