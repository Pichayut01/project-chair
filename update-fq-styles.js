const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const fqStyles = `\n
/* --- FEATURED QUESTION TEXT BLOCK --- */

.ev-featured-question {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 12px;
  padding: 18px 20px;
}

.poll-card-new .ev-featured-question {
  border-left-color: #f59e0b;
}

.ev-fq-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 900;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.ev-fq-text {
  margin: 0 !important;
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
  line-height: 1.5 !important;
  word-break: break-word;
}
`;

fs.appendFileSync(cssPath, fqStyles);
console.log('Successfully applied featured question styles.');
