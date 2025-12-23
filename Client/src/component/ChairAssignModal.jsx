import React, { useState, useEffect } from 'react';
import '../CSS/Modal.css';

const ChairAssignModal = ({ open, onClose, onConfirm, defaultName }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName(defaultName || '');
    }
  }, [open, defaultName]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Choose a name for this seat</h2>
        <div className="form-group">
          <label htmlFor="seat-assign-name">Name</label>
          <input
            id="seat-assign-name"
            type="text"
            value={name}
            placeholder="Enter name"
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button onClick={() => onConfirm(name)} disabled={!name.trim()} className="modal-action-button">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ChairAssignModal;