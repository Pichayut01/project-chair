import React, { useState } from 'react';
import { FaPlus, FaTimes, FaUsers } from 'react-icons/fa';
import '../CSS/GroupingModal.css';
import { useTranslation } from 'react-i18next';

const RANDOM_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

const getRandomColor = (usedColors = []) => {
    const available = RANDOM_COLORS.filter(c => !usedColors.includes(c));
    if (available.length === 0) {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
    return available[Math.floor(Math.random() * available.length)];
};

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);

const GroupingModal = ({ isOpen, onClose, onCreateGroups, activeGroupingEvent, onCancelGrouping }) => {
    const { t } = useTranslation();
    const [groups, setGroups] = useState(() => {
        const c1 = getRandomColor([]);
        const c2 = getRandomColor([c1]);
        const c3 = getRandomColor([c1, c2]);
        return [
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 1 }) || 'Group 1', color: c1, maxMembers: 5 },
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 2 }) || 'Group 2', color: c2, maxMembers: 5 },
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 3 }) || 'Group 3', color: c3, maxMembers: 5 },
        ];
    });

    const handleAddGroup = () => {
        const usedColors = groups.map(g => g.color);
        setGroups(prev => [
            ...prev,
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: prev.length + 1 }) || `Group ${prev.length + 1}`, color: getRandomColor(usedColors), maxMembers: 5 }
        ]);
    };

    const handleRemoveGroup = (index) => {
        if (groups.length <= 2) return;
        setGroups(prev => prev.filter((_, i) => i !== index));
    };

    const handleNameChange = (index, newName) => {
        setGroups(prev => prev.map((g, i) => i === index ? { ...g, name: newName } : g));
    };

    const handleColorChange = (index, newColor) => {
        setGroups(prev => prev.map((g, i) => i === index ? { ...g, color: newColor } : g));
    };

    const handleMaxChange = (index, value) => {
        const num = Math.max(1, Math.min(50, parseInt(value) || 1));
        setGroups(prev => prev.map((g, i) => i === index ? { ...g, maxMembers: num } : g));
    };

    const handleSubmit = () => {
        const valid = groups.every(g => g.name.trim() !== '');
        if (!valid) return;
        onCreateGroups(groups.map(g => ({ id: g.id || generateId(), name: g.name.trim(), color: g.color, maxMembers: g.maxMembers })));
        onClose();
        // Reset for next time
        const c1 = getRandomColor([]);
        const c2 = getRandomColor([c1]);
        const c3 = getRandomColor([c1, c2]);
        setGroups([
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 1 }) || 'Group 1', color: c1, maxMembers: 5 },
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 2 }) || 'Group 2', color: c2, maxMembers: 5 },
            { id: generateId(), name: t('groupingModal.defaultGroupName', { number: 3 }) || 'Group 3', color: c3, maxMembers: 5 },
        ]);
    };

    if (!isOpen) return null;

    // ✨ ACTIVE GROUPING VIEW
    if (activeGroupingEvent) {
        const activeGroups = activeGroupingEvent.config?.groups || [];
        const results = activeGroupingEvent.results || [];

        return (
            <div className="grouping-modal-backdrop" onClick={onClose}>
                <div className="grouping-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="grouping-modal-header">
                        <div className="grouping-modal-title">
                            <FaUsers className="grouping-modal-icon" />
                            <h2>{t('groupingModal.currentGroupsTitle') || 'Current Groups'}</h2>
                        </div>
                        <button className="grouping-modal-close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className="grouping-modal-body">
                        <p className="grouping-modal-desc">
                            {t('groupingModal.activeSessionDesc') || 'A grouping session is currently active. Students are joining these groups.'}
                        </p>

                        <div className="grouping-groups-list active-groups-list" style={{ marginTop: '15px' }}>
                            {activeGroups.map((group, index) => {
                                const members = results.filter(r => r.text === group.id);
                                const maxMembers = group.maxMembers || 99;
                                return (
                                    <div key={index} style={{
                                        border: '1px solid #e5e7eb',
                                        borderLeft: `5px solid ${group.color}`,
                                        borderRadius: '8px',
                                        padding: '12px 15px',
                                        background: '#fff'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>{group.name}</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>
                                                {members.length} / {maxMembers}
                                            </span>
                                        </div>
                                        {members.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {members.map((m, mIdx) => (
                                                    <div key={mIdx} title={m.userName} style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        overflow: 'hidden', border: `2px solid ${group.color}`, cursor: 'help'
                                                    }}>
                                                        {m.photoURL ? (
                                                            <img referrerPolicy="no-referrer" src={m.photoURL.startsWith('http') ? m.photoURL : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000') + m.photoURL} alt={m.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName || '?')}&background=random&size=32`; }} />
                                                        ) : (
                                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563' }}>
                                                                {m.userName?.substring(0, 2).toUpperCase() || '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>{t('groupingModal.noMembers') || 'No members yet'}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grouping-modal-footer" style={{ justifyContent: 'space-between' }}>
                        <button className="grouping-cancel-btn" onClick={onClose}>
                            {t('groupingModal.closeBtn') || 'Close'}
                        </button>
                        <button className="grouping-create-btn" style={{ background: '#ef4444' }} onClick={() => {
                            if (window.confirm(t('groupingModal.confirmCancel') || 'Are you sure you want to cancel the current grouping session?')) {
                                onCancelGrouping(activeGroupingEvent);
                                onClose();
                            }
                        }}>
                            {t('groupingModal.cancelGroupingBtn') || 'Cancel Grouping'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grouping-modal-backdrop" onClick={onClose}>
            <div className="grouping-modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="grouping-modal-header">
                    <div className="grouping-modal-title">
                        <FaUsers className="grouping-modal-icon" />
                        <h2>{t('groupingModal.createGroupsTitle') || 'Create Student Groups'}</h2>
                    </div>
                    <button className="grouping-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="grouping-modal-body">
                    <p className="grouping-modal-desc">
                        {t('groupingModal.createGroupsDesc') || 'Set up groups for students to join. Students will be able to choose their group.'}
                    </p>

                    <div className="grouping-groups-list">
                        {groups.map((group, index) => (
                            <div key={index} className="grouping-group-row">
                                <div className="grouping-color-wrapper">
                                    <input
                                        type="color"
                                        value={group.color}
                                        onChange={(e) => handleColorChange(index, e.target.value)}
                                        className="grouping-color-input"
                                    />
                                    <div
                                        className="grouping-color-preview"
                                        style={{ backgroundColor: group.color }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                    className="grouping-name-input"
                                    placeholder={t('groupingModal.groupNamePlaceholder') || 'Group name...'}
                                    maxLength={30}
                                />
                                <div className="grouping-max-wrapper">
                                    <span className="grouping-max-label">{t('groupingModal.maxMembers') || 'Max'}</span>
                                    <input
                                        type="number"
                                        value={group.maxMembers}
                                        onChange={(e) => handleMaxChange(index, e.target.value)}
                                        className="grouping-max-input"
                                        min={1}
                                        max={50}
                                    />
                                </div>
                                {groups.length > 2 && (
                                    <button
                                        className="grouping-remove-btn"
                                        onClick={() => handleRemoveGroup(index)}
                                        title={t('groupingModal.removeGroupTitle') || 'Remove group'}
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button className="grouping-add-btn" onClick={handleAddGroup}>
                        <FaPlus /> {t('groupingModal.addGroupBtn') || 'Add Group'}
                    </button>
                </div>

                {/* Footer */}
                <div className="grouping-modal-footer">
                    <button className="grouping-cancel-btn" onClick={onClose}>
                        {t('groupingModal.cancelBtn') || 'Cancel'}
                    </button>
                    <button className="grouping-create-btn" onClick={handleSubmit}>
                        <FaUsers /> {t('groupingModal.createGroupsBtn') || 'Create Groups'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupingModal;

