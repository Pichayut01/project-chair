const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');
let content = fs.readFileSync(cssPath, 'utf-8');

// Remove all duplicate blocks after the first "/* end of file */" marker
const endMarker = '/* end of file */';
const firstIdx = content.indexOf(endMarker);
if (firstIdx !== -1) {
    // Keep everything up to and including the first "/* end of file */" marker
    content = content.substring(0, firstIdx + endMarker.length) + '\n';
    fs.writeFileSync(cssPath, content);
    console.log('Cleaned up duplicate CSS blocks. File now ends at first "end of file" marker.');
} else {
    console.log('No end marker found.');
}
