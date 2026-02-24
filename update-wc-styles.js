const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const wcStyles = `\n
/* --- PREMIUM WORD CLOUD CARD STYLES --- */

.event-card:has(.wc-card-new) {
  padding: 0 !important;
  border: none !important;
  overflow: hidden !important;
}

.wc-card-new {
  border-radius: 16px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.wc-header-new {
  background: linear-gradient(to right, #ec4899, #f43f5e);
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.wc-header-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.1;
  transform: translate(16px, -16px);
  color: white;
}

.wc-header-title {
  font-size: 1.5rem !important;
  font-weight: 800 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 10;
  margin: 0 0 8px 0 !important;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.wc-header-subtitle {
  color: #fce7f3 !important;
  position: relative;
  z-index: 10;
  margin: 0 !important;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.wc-present-btn {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  position: relative;
  z-index: 10;
}

.wc-present-btn:hover {
  background: rgba(255,255,255,0.35);
  transform: translateY(-1px);
}

.wc-body-new {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.wc-preview-area {
  min-height: 200px;
  max-height: 350px;
  overflow-y: auto;
  border-radius: 16px;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
  gap: 8px 16px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.wc-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
  width: 100%;
  padding: 40px;
}

.wc-empty-state p {
  font-weight: 500;
  margin: 0;
}

.wc-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wc-input-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 640px) {
  .wc-input-row {
    flex-direction: row;
  }
}

.wc-text-input {
  flex: 1;
  background: white !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  padding: 12px 20px !important;
  font-size: 1rem !important;
  transition: all 0.2s !important;
  outline: none !important;
}

.wc-text-input:focus {
  border-color: #f43f5e !important;
  box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.1) !important;
}

.wc-send-btn {
  padding: 12px 28px !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  color: white !important;
  border: none !important;
  cursor: pointer;
  background: linear-gradient(to right, #f43f5e, #ec4899) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.2s !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.wc-send-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #e11d48, #db2777) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

.wc-send-btn:disabled {
  background: #d1d5db !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}

.wc-char-count {
  text-align: right;
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
}

.wc-submitted-msg {
  text-align: center;
  padding: 20px;
  background: #fdf2f8;
  border-radius: 12px;
  border: 1px solid #fbcfe8;
}

.wc-submitted-msg span {
  font-size: 1.25rem;
  font-weight: 700;
  color: #be185d;
}

.wc-submitted-msg p {
  margin: 4px 0 0 0;
  color: #9d174d;
  font-size: 0.875rem;
}
`;

fs.appendFileSync(cssPath, wcStyles);
console.log('Successfully applied Word Cloud card styles.');
