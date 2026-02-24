const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const fixStyles = `\n
/* ========================================== */
/* FIX: Prevent card squeezing in narrow panels */
/* ========================================== */

/* Override: Use single column by default since events panel is inside a sidebar */
.event-list {
  grid-template-columns: 1fr !important;
  gap: 16px !important;
}

/* Only go multi-column when the event list container is wide enough */
@media (min-width: 1400px) {
  .event-list {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)) !important;
  }
}
`;

fs.appendFileSync(cssPath, fixStyles);
console.log('Applied fix for card squeezing.');
