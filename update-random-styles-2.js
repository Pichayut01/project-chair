const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const newStyles = `\n
/* --- PREMIUM RANDOM CARD OVERRIDES 2 --- */

/* Fix padding overflow by using negative margins on header */
.random-event-content-new {
  margin: -20px; /* Counteract the padding of .event-card */
  border-radius: 16px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
  width: calc(100% + 40px); /* Counteract the padding of .event-card */
}

.random-header-new {
  background: linear-gradient(to right, #10b981, #059669); /* Change to green */
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.random-header-title {
  font-size: 1.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 10;
  margin: 0 0 8px 0;
}

.random-header-subtitle {
  color: #d1fae5;
  position: relative;
  z-index: 10;
  margin: 0;
  font-size: 0.95rem;
}

.random-body-new {
  padding: 24px; /* Reduced to fit better */
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.random-action-btn {
  background: linear-gradient(to right, #10b981, #059669) !important; /* Change to green */
}

.random-action-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #059669, #047857) !important; /* Change to green */
}
`;

fs.appendFileSync(cssPath, newStyles);
console.log('Successfully applied new random event styles.');
