import React from 'react';
import styled from 'styled-components';

const ViewToggle = ({ activeView, onViewChange }) => {
  return (
    <StyledWrapper>
      <div className="container">
        <div className="tabs">
          <input
            type="radio"
            id="radio-seating"
            name="view-tabs"
            checked={activeView === 'seating'}
            onChange={() => onViewChange('seating')}
          />
          <label className="tab" htmlFor="radio-seating">Seating</label>

          <input
            type="radio"
            id="radio-event"
            name="view-tabs"
            checked={activeView === 'event'}
            onChange={() => onViewChange('event')}
          />
          <label className="tab" htmlFor="radio-event">Event</label>

          <span className="glider" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    margin-right: 15px; /* Add margin to separate from other controls */
  }

  .tabs {
    display: flex;
    position: relative;
    background-color: #fff;
    box-shadow: 0 0 1px 0 rgba(76, 175, 80, 0.15), 0 6px 12px 0 rgba(76, 175, 80, 0.15);
    padding: 0.5rem; /* Reduced padding slightly */
    border-radius: 99px;
  }

  .tabs * {
    z-index: 2;
  }

  .container input[type="radio"] {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 70px; /* Increased width to fit text */
    font-size: .8rem;
    color: black;
    font-weight: 500;
    border-radius: 99px;
    cursor: pointer;
    transition: color 0.15s ease-in;
  }

  .container input[type="radio"]:checked + label {
    color: #4CAF50;
  }

  /* Glider Animation Logic */
  .container input[id="radio-seating"]:checked ~ .glider {
    transform: translateX(0);
  }

  .container input[id="radio-event"]:checked ~ .glider {
    transform: translateX(100%);
  }

  .glider {
    position: absolute;
    display: flex;
    height: 30px;
    width: 70px; /* Match tab width */
    background-color: rgba(76, 175, 80, 0.1);
    z-index: 1;
    border-radius: 99px;
    transition: 0.25s ease-out;
  }

  @media (max-width: 700px) {
    .tabs {
      transform: scale(0.9); /* Slightly smaller on mobile but not too small */
    }
  }`;

export default ViewToggle;
