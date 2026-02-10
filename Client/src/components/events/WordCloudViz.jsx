import React from 'react';
import '../../CSS/ClassroomEvent.css';

const WordCloudViz = ({ results = [], config = {}, emptyMessage = "Waiting for responses..." }) => {
    
    // Aggregation Logic
    const counts = {};
    results.forEach(r => {
        if (r.text) {
            const word = r.text.trim().toLowerCase(); // Normalize
            counts[word] = (counts[word] || 0) + 1;
        }
    });

    const words = Object.keys(counts).map(word => ({
        text: word,
        count: counts[word]
    }));

    if (words.length === 0) {
        return <div className="wordcloud-empty">{emptyMessage}</div>;
    }

    const maxCount = Math.max(...words.map(w => w.count));
    const minSize = 1.5; // rem
    const maxSize = 6; // rem (Bigger for presentation)

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#e11d48'];

    return (
        <div className="wordcloud-container" style={{ background: 'transparent', boxShadow: 'none' }}>
            {words.map((w, idx) => {
                // Calculate size relative to max
                const size = maxCount === 1 
                    ? 2 
                    : minSize + ((w.count - 1) / (maxCount - 1)) * (maxSize - minSize);
                
                const color = colors[idx % colors.length];

                return (
                    <span 
                        key={idx} 
                        className="word-tag" 
                        style={{ 
                            fontSize: `${size}rem`, 
                            color: color,
                            fontWeight: 600 + (w.count * 50),
                            margin: '0.5rem'
                        }}
                    >
                        {w.text}
                        {w.count > 1 && <span className="word-count-badge">{w.count}</span>}
                    </span>
                );
            })}
        </div>
    );
};

export default WordCloudViz;
