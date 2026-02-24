const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const fixStyles = `\n
/* --- PREMIUM RANDOM CARD OVERRIDES 4 (TEXT FIX) --- */

.random-header-title {
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.random-header-subtitle {
  color: #ecfdf5 !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.random-winner-item {
  width: 100%;
}
`;

fs.appendFileSync(cssPath, fixStyles);
console.log('Successfully applied text style fixes.');
