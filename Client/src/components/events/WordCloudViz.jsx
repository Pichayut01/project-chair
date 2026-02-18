import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import chroma from 'chroma-js';
import '../../CSS/ClassroomEvent.css';

const WordCloudViz = ({ results = [], config = {}, emptyMessage = "Waiting for responses..." }) => {
    
    // Aggregation Logic
    const words = useMemo(() => {
        const counts = {};
        results.forEach(r => {
            if (r.text) {
                const word = r.text.trim().toLowerCase(); // Normalize
                if (word) {
                    counts[word] = (counts[word] || 0) + 1;
                }
            }
        });

        return Object.keys(counts).map(word => ({
            text: word,
            count: counts[word]
        })).sort((a, b) => b.count - a.count); // Sort by count descending
    }, [results]);

    if (words.length === 0) {
        return (
            <div className="wordcloud-empty">
                <div className="wordcloud-empty-icon">☁️</div>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    const maxCount = Math.max(...words.map(w => w.count));
    const minSize = 1.5; // rem
    const maxSize = 5; // rem
    
    // Generate a color scale based on counts
    // We'll use a nice palette
    const colorScale = chroma.scale(['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']).mode('lch');

    return (
        <div className="wordcloud-container">
            {words.map((w, idx) => {
                // Calculate size relative to max
                // Logarithmic scale often looks better for word clouds to prevent huge disparities
                const size = maxCount === 1 
                    ? 2.5 
                    : minSize + (Math.log(w.count) / Math.log(maxCount)) * (maxSize - minSize);
                
                // Get color based on relative count (0 to 1)
                const colorRatio = maxCount === 1 ? 0.5 : (w.count - 1) / (maxCount - 1);
                // Mix in some random variation for aesthetics
                const color = colorScale(colorRatio).brighten(idx % 2 === 0 ? 0.2 : 0).hex();
                
                // Random rotation between -10 and 10 degrees for organic feel
                // Use a deterministic random based on word text so it doesn't jitter on re-render
                const rotation = (w.text.length % 4 - 1.5) * 5; 

                return (
                    <motion.span 
                        key={w.text} // Use text as key correctly
                        className="word-tag" 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260, 
                            damping: 20, 
                            delay: idx * 0.05 
                        }}
                        whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
                        style={{ 
                            fontSize: `${size}rem`, 
                            color: color,
                            fontWeight: 600 + (Math.min(w.count, 10) * 30),
                            margin: '0.25rem 0.75rem',
                            display: 'inline-block',
                            rotate: `${rotation}deg`,
                            cursor: 'default',
                            textShadow: '1px 1px 0px rgba(255,255,255,0.5)'
                        }}
                        title={`${w.count} occurrence${w.count > 1 ? 's' : ''}`}
                    >
                        {w.text}
                        {w.count > 1 && (
                            <span className="word-count-badge" style={{ fontSize: '0.4em', verticalAlign: 'super', marginLeft: '2px', opacity: 0.8 }}>
                                {w.count}
                            </span>
                        )}
                    </motion.span>
                );
            })}
        </div>
    );
};

export default WordCloudViz;
