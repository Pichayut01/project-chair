const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const fixStyles = `\n
/* --- PREMIUM RANDOM CARD OVERRIDES 3 (FIXES) --- */

/* Fix padding overflow on the card itself */
.event-card:has(.random-event-content-new) {
  padding: 0 !important;
  border: none !important;
  overflow: hidden !important;
}

.random-event-content-new {
  margin: 0 !important; /* Reset negative margin */
  width: 100% !important; /* Reset width calc */
  border-radius: 16px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.random-header-new {
  border-radius: 16px 16px 0 0;
}

`;

fs.appendFileSync(cssPath, fixStyles);
console.log('Successfully applied style fixes.');
