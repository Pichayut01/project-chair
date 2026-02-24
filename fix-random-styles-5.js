const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const fixStyles = `\n
/* --- PREMIUM RANDOM CARD OVERRIDES 5 (CENTERING FIX) --- */
.random-winners-list {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.random-winner-item {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
}

.random-name.winner {
  text-align: center !important;
  margin-top: 12px !important;
  width: 100% !important;
}
`;

fs.appendFileSync(cssPath, fixStyles);
console.log('Successfully applied centering fixes.');
