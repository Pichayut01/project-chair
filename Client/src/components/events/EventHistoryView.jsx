import React, { useState } from 'react';
import { FaChartBar, FaQuestionCircle, FaCloud, FaClock, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../../CSS/ClassroomEvent.css'; // ✨ Fix path to CSS

const EventHistoryView = ({ events }) => {
    // Sort events by created date descending
    const sortedEvents = [...(events || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getEventIcon = (type) => {
        switch (type) {
            case 'poll': return <FaChartBar className="event-icon poll" />;
            case 'question': return <FaQuestionCircle className="event-icon question" />;
            case 'wordcloud': return <FaCloud className="event-icon wordcloud" />;
            default: return <FaQuestionCircle />;
        }
    };

    const getEventSummary = (event) => {
        if (!event.results) return "No data";
        
        switch (event.type) {
            case 'poll':
                const totalVotes = event.results.reduce((sum, r) => sum + r.count, 0);
                // Find top option
                const topOption = event.results.reduce((prev, current) => (prev.count > current.count) ? prev : current, {count: -1});
                return `${totalVotes} Votes • Top: ${topOption.option || 'None'}`;
            
            case 'question':
                const answerCount = event.results ? event.results.length : 0;
                return `${answerCount} Answers`;

            case 'wordcloud':
                const wordCount = event.results ? event.results.length : 0;
                return `${wordCount} Words submitted`;

            default:
                return "Active";
        }
    };

    return (
        <div className="event-history-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Event History</h2>
            
            {sortedEvents.length === 0 ? (
                <div className="no-events" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No events recorded in this classroom yet.
                </div>
            ) : (
                <div className="event-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {sortedEvents.map(event => (
                        <div key={event.id} className="event-history-card" style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
                            border: '1px solid #f1f5f9',
                            borderTop: '5px solid #10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}>
                             <div className="event-icon-wrapper" style={{ 
                                 width: '40px', height: '40px', 
                                 background: '#f1f5f9', borderRadius: '8px',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 fontSize: '1.2rem', color: '#475569'
                             }}>
                                {getEventIcon(event.type)}
                             </div>
                             
                             <div className="event-info" style={{ flex: 1 }}>
                                 <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f172a' }}>
                                     {event.config?.topic || event.type.toUpperCase()}
                                 </h3>
                                 <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                                     <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                         <FaClock size={12} /> {new Date(event.createdAt).toLocaleDateString()}
                                     </span>
                                     <span>•</span>
                                     <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                         <FaCheckCircle size={12} /> {event.status === 'active' ? 'Active' : 'Ended'}
                                     </span>
                                 </div>
                             </div>

                             <div className="event-stats" style={{ 
                                 textAlign: 'right', 
                                 background: '#f8fafc',
                                 padding: '8px 12px',
                                 borderRadius: '6px',
                                 border: '1px solid #f1f5f9',
                                 fontSize: '0.9rem',
                                 color: '#334155',
                                 fontWeight: '500'
                             }}>
                                 {getEventSummary(event)}
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventHistoryView;
