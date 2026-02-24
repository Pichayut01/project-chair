const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const newStyles = `\n
/* --- PREMIUM RANDOM CARD OVERRIDES --- */

.random-event-content-new {
  border-radius: 16px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.random-header-new {
  background: linear-gradient(to right, #6366f1, #9333ea);
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.random-header-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.1;
  transform: translate(16px, -16px);
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
  color: #e0e7ff;
  position: relative;
  z-index: 10;
  margin: 0;
  font-size: 0.95rem;
}

.random-body-new {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.random-display-area {
  min-height: 240px;
  border-radius: 16px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.random-display-area.idle {
  border-color: #d1d5db;
  border-style: dashed;
  background-color: #f9fafb;
}

.random-display-area.spinning {
  border-color: #818cf8;
  border-style: solid;
  background-color: #eef2ff;
  animation: pulseBg 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.random-display-area.winner {
  border-color: #4ade80;
  border-style: solid;
  background-color: #f0fdf4;
  transform: scale(1.05);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@keyframes pulseBg {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

.random-idle-text {
  font-size: 1.5rem;
  color: #9ca3af;
  font-weight: 700;
  margin: 0;
}

.random-animating-container, .random-winners-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.random-animating-item, .random-winner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.random-avatar {
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid;
  background: white;
  transition: all 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.random-avatar-placeholder {
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Specific states for avatar */
.random-avatar.animating, .random-avatar-placeholder.animating {
  width: 80px;
  height: 80px;
  border-color: #a5b4fc;
  color: #6366f1;
  font-size: 2rem;
}

.random-avatar.winner, .random-avatar-placeholder.winner {
  width: 96px;
  height: 96px;
  border-color: #4ade80;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  color: #22c55e;
  font-size: 2.5rem;
  animation: bounceAvatar 1s;
}

@keyframes bounceAvatar {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.random-name {
  margin: 0;
  transition: all 0.2s;
  font-weight: 700;
}

.random-name.animating {
  font-size: 1.5rem;
  color: #6366f1;
}

.random-name.winner {
  font-size: 1.875rem;
  color: #15803d;
}

.winner-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: bounceAvatar 2s infinite;
  justify-content: center;
}

.random-participant-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
}

.rpc-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rpc-left svg {
  color: #9ca3af;
  font-size: 1.1rem;
}

.rpc-right {
  font-weight: 600;
  color: #374151;
}

.random-action-btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s;
  border: none;
  background: linear-gradient(to right, #4f46e5, #9333ea) !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  cursor: pointer;
}

.random-action-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #4338ca, #7e22ce) !important;
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

.random-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.random-action-btn.spinning, .random-action-btn:disabled {
  background: #9ca3af !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none !important;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Ensure global event card drops padding when random is used to allow edge-to-edge header */
.event-card:has(.random-event-content-new) {
  padding: 0 !important;
  overflow: hidden;
}
`;

fs.appendFileSync(cssPath, newStyles);
console.log('Successfully applied new random event styles.');
