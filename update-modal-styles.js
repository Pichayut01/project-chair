const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'Client', 'src', 'CSS', 'ClassroomEvent.css');

const modalStyles = `\n
/* ========================================== */
/* PREMIUM MODAL STYLES                       */
/* ========================================== */

.modal-overlay-new {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-card-new {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
  animation: modalSlideUp 0.3s ease-out;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.config-modal-new {
  max-width: 520px;
}

.modal-header-new {
  padding: 24px 28px;
  color: white;
  position: relative;
}

.modal-header-new h3 {
  margin: 0 0 4px 0 !important;
  font-size: 1.35rem !important;
  font-weight: 800 !important;
  display: flex !important;
  align-items: center;
  color: white !important;
}

.modal-header-new p {
  margin: 0 !important;
  color: rgba(255,255,255,0.8) !important;
  font-size: 0.9rem;
}

.modal-close-x {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.modal-close-x:hover {
  background: rgba(255,255,255,0.3);
}

.modal-body-new {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer-new {
  padding: 16px 28px;
  background: #f9fafb;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* --- EVENT TYPE SELECTOR --- */

.event-type-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-type-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #f1f5f9;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.event-type-card:hover {
  border-color: var(--card-accent, #10b981);
  background: #fafffe;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.etc-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.etc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.etc-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e293b;
}

.etc-desc {
  font-size: 0.8rem;
  color: #94a3b8;
}

.etc-arrow {
  color: #cbd5e1;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.event-type-card:hover .etc-arrow {
  color: var(--card-accent, #10b981);
  transform: translateX(4px);
}

/* --- CONFIG FORM --- */

.cfg-group {
  margin-bottom: 20px;
}

.cfg-group:last-child {
  margin-bottom: 0;
}

.cfg-label {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 8px;
}

.cfg-input,
.cfg-textarea {
  width: 100% !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 0.95rem !important;
  transition: all 0.2s !important;
  outline: none !important;
  background: white !important;
  box-sizing: border-box !important;
  font-family: inherit !important;
}

.cfg-input:focus,
.cfg-textarea:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 4px rgba(16,185,129,0.1) !important;
}

.cfg-textarea {
  resize: vertical !important;
  min-height: 80px !important;
}

.cfg-helper {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 6px 0 0 0;
}

.cfg-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid #fecaca;
  margin-top: 8px;
}

/* Number input */
.cfg-number-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  width: fit-content;
}

.cfg-num-btn {
  width: 44px;
  height: 44px;
  border: none !important;
  background: #f8fafc !important;
  color: #374151 !important;
  font-size: 1.2rem !important;
  cursor: pointer;
  transition: all 0.2s !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cfg-num-btn:hover {
  background: #e5e7eb !important;
}

.cfg-num-input {
  width: 60px !important;
  text-align: center !important;
  border: none !important;
  border-left: 2px solid #e5e7eb !important;
  border-right: 2px solid #e5e7eb !important;
  padding: 10px 0 !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  outline: none !important;
  background: white !important;
  -moz-appearance: textfield !important;
}

.cfg-num-input::-webkit-outer-spin-button,
.cfg-num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Upload area */
.cfg-upload-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cfg-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cfg-upload-btn:hover {
  border-color: #10b981;
  color: #059669;
  background: #ecfdf5;
}

.cfg-image-preview {
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.cfg-image-preview img {
  max-height: 120px;
  display: block;
  border-radius: 12px;
}

.cfg-remove-img {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

/* Options list */
.cfg-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cfg-option-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cfg-opt-num {
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

.cfg-opt-input {
  flex: 1;
  border: 2px solid #e5e7eb !important;
  border-radius: 10px !important;
  padding: 10px 14px !important;
  font-size: 0.9rem !important;
  outline: none !important;
  transition: all 0.2s !important;
  background: white !important;
}

.cfg-opt-input:focus {
  border-color: #f59e0b !important;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1) !important;
}

.cfg-opt-remove {
  width: 28px;
  height: 28px;
  border: none !important;
  background: #fef2f2 !important;
  color: #ef4444 !important;
  border-radius: 8px !important;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s !important;
}

.cfg-opt-remove:hover {
  background: #fee2e2 !important;
}

.cfg-add-opt {
  border: 2px dashed #d1d5db !important;
  border-radius: 10px !important;
  padding: 10px !important;
  background: transparent !important;
  color: #6b7280 !important;
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.2s !important;
  font-size: 0.9rem !important;
}

.cfg-add-opt:hover {
  border-color: #f59e0b !important;
  color: #d97706 !important;
  background: #fffbeb !important;
}

/* Score mini */
.cfg-score-mini {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cfg-score-pts {
  width: 48px !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 8px !important;
  padding: 6px !important;
  text-align: center !important;
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  outline: none !important;
  -moz-appearance: textfield !important;
}

.cfg-score-pts::-webkit-outer-spin-button,
.cfg-score-pts::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.cfg-score-action {
  border: 2px solid #e5e7eb !important;
  border-radius: 8px !important;
  padding: 6px 8px !important;
  font-weight: 700 !important;
  cursor: pointer;
  outline: none !important;
  background: white !important;
}

.cfg-score-action.action-add { color: #059669 !important; }
.cfg-score-action.action-sub { color: #dc2626 !important; }

/* Toggle */
.cfg-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
}

.cfg-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
  cursor: pointer;
}

/* Buttons */
.cfg-cancel-btn {
  padding: 10px 24px !important;
  border: 2px solid #e5e7eb !important;
  border-radius: 12px !important;
  background: white !important;
  color: #64748b !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  cursor: pointer;
  transition: all 0.2s !important;
}

.cfg-cancel-btn:hover {
  border-color: #94a3b8 !important;
  color: #334155 !important;
}

.cfg-create-btn {
  padding: 10px 28px !important;
  border: none !important;
  border-radius: 12px !important;
  background: linear-gradient(to right, #10b981, #059669) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  cursor: pointer;
  transition: all 0.2s !important;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(16,185,129,0.2) !important;
}

.cfg-create-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 15px rgba(16,185,129,0.3) !important;
}
`;

fs.appendFileSync(cssPath, modalStyles);
console.log('Successfully applied premium modal styles.');
