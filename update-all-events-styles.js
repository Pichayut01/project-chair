const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const allEventStyles = `\n
/* ========================================== */
/* SHARED PREMIUM EVENT CARD STYLES           */
/* ========================================== */

.event-card:has(.ev-card-new) {
  padding: 0 !important;
  border: none !important;
  overflow: hidden !important;
}

.ev-card-new {
  border-radius: 16px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
}

.ev-header-new {
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.ev-header-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.1;
  transform: translate(16px, -16px);
  color: white;
}

.ev-header-title {
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

.ev-header-subtitle {
  color: rgba(255,255,255,0.85) !important;
  position: relative;
  z-index: 10;
  margin: 0 !important;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.ev-body-new {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ev-image-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.ev-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.ev-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
  padding: 30px;
}

.ev-empty-state p {
  margin: 0;
  font-weight: 500;
}

/* --- SHARED INPUT / SUBMITTED --- */

.ev-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ev-textarea {
  width: 100% !important;
  background: white !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 0.95rem !important;
  resize: vertical !important;
  min-height: 80px !important;
  transition: all 0.2s !important;
  outline: none !important;
  box-sizing: border-box !important;
  font-family: inherit !important;
}

.ev-textarea:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
}

.ev-submit-btn {
  padding: 12px 24px !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  color: white !important;
  border: none !important;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
  transition: all 0.2s !important;
  width: 100%;
}

.ev-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
}

.ev-submit-btn:disabled {
  background: #d1d5db !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}

.ev-submitted-msg {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.ev-submitted-msg span {
  font-size: 1.15rem;
  font-weight: 700;
  display: block;
}

.ev-submitted-msg p {
  margin: 4px 0 0 0;
  font-size: 0.875rem;
}

/* --- QUESTION CARD: ANSWERS --- */

.ev-answers-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ev-answers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
}

.ev-answers-count {
  background: #3b82f6;
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

.ev-answers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.ev-answer-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s;
}

.ev-answer-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}

.ev-answer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.ev-answer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.ev-answer-user-info {
  display: flex;
  flex-direction: column;
}

.ev-answer-username {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.ev-answer-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.ev-answer-body {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.5;
  padding-left: 46px;
}

/* --- POLL CARD --- */

.ev-poll-results {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ev-poll-result-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ev-poll-result-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.ev-poll-result-count {
  color: #64748b;
  font-weight: 500;
}

.ev-poll-bar-bg {
  height: 10px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.ev-poll-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #f59e0b, #d97706);
  border-radius: 10px;
  transition: width 0.6s ease-in-out;
}

.ev-poll-total {
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.ev-poll-live-badge {
  color: #10b981;
  font-weight: 700;
  font-size: 0.8rem;
  margin-left: 6px;
}

.ev-poll-voting {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ev-poll-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ev-poll-vote-btn {
  width: 100%;
  padding: 14px 20px !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  background: white !important;
  color: #1e293b !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.2s !important;
  text-align: left !important;
}

.ev-poll-vote-btn:hover {
  border-color: #f59e0b !important;
  background: #fffbeb !important;
  transform: translateX(4px) !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15) !important;
}

/* --- BUZZ CARD --- */

.ev-buzz-status {
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #64748b;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.ev-buzz-status.go {
  background: #ecfdf5;
  border-color: #10b981;
  color: #059669;
  animation: buzzPulse 1s ease-in-out infinite;
}

.ev-buzz-status.ready {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
}

@keyframes buzzPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.ev-buzz-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ev-buzz-actions {
  display: flex;
  gap: 10px;
}

.ev-buzz-start-btn {
  flex: 1;
  padding: 12px 20px !important;
  border: none !important;
  border-radius: 12px !important;
  background: linear-gradient(to right, #ef4444, #dc2626) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  cursor: pointer;
  transition: all 0.2s !important;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2) !important;
}

.ev-buzz-start-btn:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 15px rgba(239, 68, 68, 0.3) !important;
}

.ev-buzz-start-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.ev-buzz-reset-btn {
  padding: 12px 20px !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  background: white !important;
  color: #64748b !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  cursor: pointer;
  transition: all 0.2s !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ev-buzz-reset-btn:hover {
  border-color: #94a3b8 !important;
  color: #334155 !important;
}

.ev-buzz-winner {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.ev-buzz-winner h4 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #92400e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ev-buzz-winner-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ev-buzz-winner-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f59e0b;
}

.ev-buzz-winner-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.ev-buzz-winner-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

.ev-buzz-winner-time {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

/* Student Buzz Hand */
.ev-buzz-student {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.ev-buzz-hand-btn {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: 2.5rem;
  cursor: not-allowed;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.ev-buzz-hand-btn.active {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  color: white !important;
  cursor: pointer !important;
  animation: buzzBtnPulse 1.5s ease-in-out infinite;
  box-shadow: 0 8px 25px rgba(239,68,68,0.4) !important;
}

.ev-buzz-hand-btn.active:hover {
  transform: scale(1.1) !important;
}

@keyframes buzzBtnPulse {
  0%, 100% { box-shadow: 0 8px 25px rgba(239,68,68,0.4); }
  50% { box-shadow: 0 8px 40px rgba(239,68,68,0.6); }
}
`;

fs.appendFileSync(cssPath, allEventStyles);
console.log('Successfully applied all premium event card styles.');
