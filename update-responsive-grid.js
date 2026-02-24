const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const responsiveStyles = `\n
/* ========================================== */
/* RESPONSIVE EVENT CARD GRID                 */
/* ========================================== */

/* Override the base grid with better responsive behavior */
.event-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
  gap: 20px !important;
  padding: 16px !important;
  align-items: start !important;
}

/* Large screens: 3 columns max */
@media (min-width: 1200px) {
  .event-list {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 24px !important;
  }
}

/* Medium screens: 2 columns */
@media (min-width: 768px) and (max-width: 1199px) {
  .event-list {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 20px !important;
  }
}

/* Small screens: 1 column */
@media (max-width: 767px) {
  .event-list {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
    padding: 12px !important;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .event-list {
    gap: 12px !important;
    padding: 8px !important;
  }
}

/* Make sure event-card fills grid cell properly */
.event-card {
  width: 100% !important;
  max-width: 100% !important;
  display: block !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
}

/* Make add-event-card fill grid too */
.add-event-card {
  width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
  min-height: 180px !important;
}

/* Premium cards should fill their parent event-card */
.ev-card-new,
.random-event-content-new,
.wc-card-new {
  width: 100% !important;
  box-sizing: border-box !important;
}

/* Responsive card content */
@media (max-width: 480px) {
  .ev-header-new {
    padding: 18px !important;
  }
  
  .ev-header-title {
    font-size: 1.2rem !important;
  }
  
  .ev-body-new {
    padding: 16px !important;
  }
  
  .ev-featured-question {
    padding: 14px !important;
  }
  
  .ev-fq-text {
    font-size: 1.05rem !important;
  }
  
  .ev-buzz-hand-btn {
    width: 100px !important;
    height: 100px !important;
  }
  
  .ev-poll-vote-btn {
    padding: 12px 16px !important;
  }
}
`;

fs.appendFileSync(cssPath, responsiveStyles);
console.log('Successfully applied responsive grid styles.');
