const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const greenThemeStyles = `\n
/* --- WORD CLOUD GREEN THEME + ANIMATION --- */

.wc-header-new {
  background: linear-gradient(to right, #10b981, #059669) !important;
}

.wc-header-subtitle {
  color: #d1fae5 !important;
}

.wc-text-input:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
}

.wc-send-btn {
  background: linear-gradient(to right, #10b981, #059669) !important;
}

.wc-send-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #059669, #047857) !important;
}

.wc-submitted-msg {
  background: #ecfdf5 !important;
  border: 1px solid #a7f3d0 !important;
}

.wc-submitted-msg span {
  color: #047857 !important;
}

.wc-submitted-msg p {
  color: #065f46 !important;
}

/* Word Cloud floating animation */
@keyframes wcFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(-1deg); }
  75% { transform: translateY(4px) rotate(1deg); }
}

@keyframes wcPopIn {
  0% { transform: scale(0.2) translateY(20px); opacity: 0; filter: blur(4px); }
  60% { transform: scale(1.1) translateY(-5px); opacity: 1; filter: blur(0px); }
  100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
}

.word-tag {
  animation: wcPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both !important;
  transition: transform 0.3s ease, color 0.3s ease !important;
  cursor: default;
}

.word-tag:hover {
  transform: scale(1.15) translateY(-4px) !important;
  z-index: 10 !important;
}

.wordcloud-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 12px;
  padding: 10px;
  width: 100%;
}

/* Presentation page styles */
.presentation-page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #d1fae5 100%) !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem;
  font-family: 'Prompt', 'Inter', sans-serif;
}

.pres-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 1000px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.pres-header {
  background: linear-gradient(to right, #10b981, #059669);
  padding: 32px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.pres-header-bg {
  position: absolute;
  top: -20px;
  right: -20px;
  opacity: 0.08;
  font-size: 10rem;
  color: white;
}

.pres-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  position: relative;
  z-index: 10;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pres-header p {
  color: #d1fae5;
  position: relative;
  z-index: 10;
  margin: 0;
  font-size: 1.1rem;
}

.pres-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fafffe;
}

.pres-footer {
  padding: 16px 40px;
  background: #f9fafb;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
  font-size: 0.9rem;
}

.pres-word-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #059669;
}

.pres-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ecfdf5;
  color: #059669;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
}

.pres-live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

.pres-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  font-size: 1.5rem;
  color: #059669;
  font-weight: 600;
}

.pres-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  font-size: 1.5rem;
  color: #dc2626;
  font-weight: 600;
}
`;

fs.appendFileSync(cssPath, greenThemeStyles);
console.log('Successfully applied green theme + animation styles.');
