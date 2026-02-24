const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const premiumOverrides = `\n
/* --- PREMIUM UI OVERRIDES --- */

/* Event Card General */
.event-card {
  border-radius: 16px !important;
  background: #ffffff !important;
  padding: 24px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01) !important;
  border: 1px solid #f1f5f9 !important;
  border-top: 5px solid #10b981 !important;
  border-left: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.event-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
}

.event-card-header {
  margin-bottom: 20px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  padding-bottom: 16px !important;
}

.event-card-header h3 {
  color: #0f172a !important;
  font-size: 1.4rem !important;
  font-weight: 800 !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  letter-spacing: -0.02em !important;
}

/* Add Event Card */
.add-event-card {
  border: 2px dashed #cbd5e1 !important;
  background: #f8fafc !important;
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: #64748b !important;
}

.add-event-card:hover {
  background: #f1f5f9 !important;
  border-color: #10b981 !important;
  color: #10b981 !important;
  transform: translateY(-4px) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05) !important;
}

.add-event-card-icon {
  background: white !important;
  color: inherit !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
  width: 56px !important;
  height: 56px !important;
}

/* Buttons */
.start-random-btn, .buzz-start-btn, .submit-answer-btn, .wordcloud-submit-btn {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
  border: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: white !important;
}

.start-random-btn:hover:not(:disabled), .buzz-start-btn:hover:not(:disabled), .submit-answer-btn:hover:not(:disabled), .wordcloud-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
}

.start-random-btn:active:not(:disabled), .buzz-start-btn:active:not(:disabled), .submit-answer-btn:active:not(:disabled), .wordcloud-submit-btn:active:not(:disabled) {
  transform: translateY(0) !important;
}

.reroll-random-btn, .buzz-reset-btn {
  background: #f1f5f9 !important;
  color: #475569 !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  border: none !important;
  box-shadow: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.reroll-random-btn:hover, .buzz-reset-btn:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  transform: translateY(-2px) !important;
}

/* Poll Content */
.poll-vote-btn {
  border-radius: 12px !important;
  padding: 16px 20px !important;
  border: 2px solid #e2e8f0 !important;
  font-weight: 600 !important;
  font-size: 1.05rem !important;
  color: #334155 !important;
  background: #ffffff !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.poll-vote-btn:hover {
  border-color: #10b981 !important;
  background: #f0fdf4 !important;
  color: #166534 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1) !important;
}

.poll-result-item {
  background: #f8fafc !important;
  border-radius: 12px !important;
  padding: 14px 18px !important;
  border: 1px solid #e2e8f0 !important;
  margin-bottom: 12px !important;
}

.poll-result-label {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
}

.poll-progress-bar-bg {
  height: 12px !important;
  border-radius: 6px !important;
  background: #e2e8f0 !important;
  margin-top: 8px !important;
}

.poll-progress-bar-fill {
  background: linear-gradient(90deg, #34d399, #10b981) !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2) !important;
}

/* Question Event Content */
.question-text {
  background: #f8fafc !important;
  border: 1px solid #f1f5f9 !important;
  border-radius: 16px !important;
  padding: 24px !important;
  font-size: 1.4rem !important;
  color: #0f172a !important;
  font-weight: 800 !important;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02) !important;
  margin-bottom: 24px !important;
}

.answers-section h4 {
  color: #64748b !important;
  font-size: 0.95rem !important;
  padding-bottom: 8px !important;
}

.answer-card {
  background: white !important;
  border: 1px solid #f1f5f9 !important;
  border-radius: 12px !important;
  padding: 16px !important;
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.05) !important;
}

.answer-textarea {
  border-radius: 12px !important;
  border: 2px solid #e2e8f0 !important;
  padding: 16px !important;
  font-size: 1.05rem !important;
  background: #f8fafc !important;
  transition: all 0.2s ease !important;
}

.answer-textarea:focus {
  border-color: #10b981 !important;
  background: white !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

/* Random Student Event Content */
.random-badge {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #10b981 !important;
  border-radius: 8px !important;
  padding: 6px 14px !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
}

.winner-card {
  border: 2px solid #10b981 !important;
  background: linear-gradient(to bottom, #ffffff, #f0fdf4) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.3) !important;
  padding: 24px 16px !important;
}

.winner-avatar-large {
  border-color: #10b981 !important;
  border-width: 4px !important;
  width: 90px !important;
  height: 90px !important;
}

.winner-name {
  color: #064e3b !important;
  font-size: 1.4rem !important;
  margin-top: 12px !important;
}

/* Buzz Button Event Content */
.buzz-status {
  border-radius: 20px !important;
  background: #f8fafc !important;
  border: 2px solid #e2e8f0 !important;
  font-size: 1.6rem !important;
  padding: 16px 32px !important;
}

.buzz-status.active {
  background: #f0fdf4 !important;
  border-color: #10b981 !important;
  color: #10b981 !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2) !important;
}

.buzz-hand-btn {
  background: linear-gradient(145deg, #f59e0b, #d97706) !important;
  box-shadow: 0 12px 0 #b45309, 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
}

.buzz-hand-btn.active {
  background: linear-gradient(145deg, #10b981, #059669) !important;
  box-shadow: 0 12px 0 #047857, 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
}

.buzz-winner-card {
  border: 3px solid #10b981 !important;
  background: linear-gradient(to bottom, #ffffff, #f0fdf4) !important;
  border-radius: 20px !important;
  box-shadow: 0 15px 25px -5px rgba(16, 185, 129, 0.3) !important;
  padding: 24px !important;
}

/* Word Cloud Event Content */
.wordcloud-topic {
  color: #0f172a !important;
  background: #f8fafc !important;
  padding: 16px 28px !important;
  border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
}

.wordcloud-input-group {
  border-radius: 16px !important;
  padding: 8px !important;
  border: 2px solid #e2e8f0 !important;
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05) !important;
  background: #ffffff !important;
  transition: all 0.2s ease !important;
}

.wordcloud-input-group:focus-within {
  border-color: #10b981 !important;
  box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.1) !important;
}

.wordcloud-input {
  border-radius: 12px !important;
  font-size: 1.15rem !important;
  padding: 12px 16px !important;
}

.wordcloud-submit-btn {
  border-radius: 12px !important;
  padding: 0 32px !important;
  font-size: 1.1rem !important;
}
`;

fs.appendFileSync(cssPath, premiumOverrides);
console.log('Successfully applied premium overrides to ClassroomEvent.css');
