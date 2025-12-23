import React from 'react';
import '../CSS/ActionBar.css';

const ActionBar = ({ actions }) => {
    return (
        <div className="action-bar-container">
            <div id="navbody">
                <ul className="ul">
                    {actions.map((action, index) => (
                        <li key={action.id} className="li">
                            <input
                                type="checkbox" // Changed to checkbox to better represent toggleable independent states
                                name={`action-bar-${action.id}`}
                                id={`action-radio-${action.id}`}
                                className="radio"
                                checked={action.isActive}
                                onChange={() => action.onClick && action.onClick()}
                            />
                            <label htmlFor={`action-radio-${action.id}`}>
                                <div
                                    className="svg-container"
                                    title={action.label}
                                // Removed onClick here to prevent double-firing with label/input
                                >
                                    {action.icon}
                                </div>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ActionBar;
