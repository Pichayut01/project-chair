import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import chroma from 'chroma-js';
import { useTranslation } from 'react-i18next';
import '../../CSS/ClassroomEvent.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const createMeasurementContext = () => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    return canvas.getContext('2d');
};

const measureWord = (context, text, fontSize, fontWeight) => {
    if (!context) {
        return {
            width: Math.ceil(text.length * fontSize * 0.58),
            height: Math.ceil(fontSize * 0.92)
        };
    }

    context.font = `${fontWeight} ${fontSize}px Prompt, sans-serif`;
    return {
        width: Math.ceil(context.measureText(text).width),
        height: Math.ceil(fontSize * 0.92)
    };
};

const WordCloudViz = ({ results = [], emptyMessage = "Waiting for responses...", variant = 'card' }) => {
    const { t } = useTranslation();
    const tr = (key, defaultValue, options = {}) => t(key, { defaultValue, ...options });
    const viewportRef = useRef(null);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = viewportRef.current;
        if (!element) return undefined;

        const updateSize = () => {
            setViewportSize({
                width: element.clientWidth,
                height: element.clientHeight
            });
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }

        const observer = new ResizeObserver(updateSize);
        observer.observe(element);

        return () => observer.disconnect();
    }, [variant]);

    const words = useMemo(() => {
        const counts = {};
        results.forEach((result) => {
            if (!result?.text) return;

            const word = result.text.trim().toLowerCase();
            if (word) {
                counts[word] = (counts[word] || 0) + 1;
            }
        });

        return Object.keys(counts)
            .map((word) => ({
                text: word,
                count: counts[word]
            }))
            .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
    }, [results]);

    const cardWords = useMemo(() => {
        if (variant !== 'card' || !words.length) return [];

        const maxCount = Math.max(...words.map((word) => word.count));
        const minFont = words.length > 24 ? 18 : words.length > 12 ? 20 : 24;
        const maxFont = words.length > 24 ? 40 : words.length > 12 ? 46 : 54;
        const colorScale = chroma.scale(['#4338ca', '#8b5cf6', '#ec4899', '#fb7185', '#fde047']).mode('lch');

        return words.map((word, index) => {
            const prominence = maxCount === 1 ? 0.55 : Math.log(word.count + 1) / Math.log(maxCount + 1);
            const fontSize = clamp(minFont + prominence * (maxFont - minFont), 16, maxFont);
            const fontWeight = index < 3 ? 800 : index < 10 ? 700 : 600;

            return {
                ...word,
                fontSize,
                fontWeight,
                color: colorScale(maxCount === 1 ? 0.5 : (word.count - 1) / (maxCount - 1)).hex()
            };
        });
    }, [variant, words]);

    const layout = useMemo(() => {
        if (variant !== 'presentation' || !words.length) return null;

        const viewportWidth = Math.max(viewportSize.width || 1120, 260);
        const viewportHeight = Math.max(viewportSize.height || 640, 320);
        const isCompact = viewportWidth < 820;
        const isPhone = viewportWidth < 560;
        const stageWidth = Math.max(viewportWidth - (isPhone ? 10 : isCompact ? 14 : 18), 240);
        const maxCount = Math.max(...words.map((word) => word.count));
        const densityScaleBase = words.length > 40 ? 0.62 : words.length > 28 ? 0.72 : words.length > 18 ? 0.82 : words.length > 10 ? 0.9 : 1;
        const widthScale = clamp(stageWidth / 1100, 0.42, 1);
        const densityScale = densityScaleBase * (isPhone ? 0.86 : isCompact ? 0.92 : 1);
        const minFont = isPhone ? 14 : isCompact ? 18 : 24;
        const maxFont = clamp(stageWidth * (isPhone ? 0.18 : isCompact ? 0.16 : 0.13), isPhone ? 34 : 42, 118);
        const colorScale = chroma.scale(['#4338ca', '#8b5cf6', '#ec4899', '#fb7185', '#fde047']).mode('lch');
        const measureContext = createMeasurementContext();

        const buildMeasuredWords = (fitScale) => words.map((word, index) => {
            const prominence = maxCount === 1 ? 0.55 : Math.log(word.count + 1) / Math.log(maxCount + 1);
            const fontSize = clamp(
                (minFont + prominence * (maxFont - minFont)) * densityScale * fitScale * widthScale,
                isPhone ? 12 : 16,
                maxFont
            );
            const fontWeight = index < 3 ? 800 : index < 10 ? 700 : 600;
            const { width, height } = measureWord(measureContext, word.text, fontSize, fontWeight);

            return {
                ...word,
                fontSize,
                fontWeight,
                width,
                height,
                color: colorScale(maxCount === 1 ? 0.5 : (word.count - 1) / (maxCount - 1)).hex()
            };
        });

        let measuredWords = buildMeasuredWords(1);
        const estimatedArea = measuredWords.reduce((sum, word) => sum + (word.width + 18) * (word.height + 18), 0);
        const availableArea = stageWidth * Math.max(viewportHeight, isPhone ? 280 : 360) * (isPhone ? 0.66 : isCompact ? 0.54 : 0.42);
        const fitScale = clamp(
            Math.sqrt(availableArea / Math.max(estimatedArea, 1)),
            isPhone ? 0.48 : isCompact ? 0.54 : 0.58,
            1
        );

        measuredWords = buildMeasuredWords(fitScale);

        let stageHeight = Math.max(viewportHeight, isPhone ? 360 : isCompact ? 460 : 560);

        const padding = isPhone ? 6 : isCompact ? 8 : 10;
        const centerX = stageWidth / 2;
        const centerY = stageHeight / 2;
        const collisionBoxes = [];
        const placedWords = [];

        measuredWords.forEach((word, index) => {
            let placedWord = null;

            for (let step = 0; step < 2600; step += 1) {
                const angle = index * 0.9 + step * 0.32;
                const radius = 4 + step * 2.1;
                const x = centerX + Math.cos(angle) * radius - word.width / 2;
                const y = centerY + Math.sin(angle) * radius * 0.72 - word.height / 2;
                const box = {
                    left: x - padding,
                    top: y - padding,
                    right: x + word.width + padding,
                    bottom: y + word.height + padding
                };

                if (box.left < padding || box.top < padding || box.right > stageWidth - padding || box.bottom > stageHeight - padding) {
                    continue;
                }

                const overlaps = collisionBoxes.some((existing) => !(
                    box.right < existing.left ||
                    box.left > existing.right ||
                    box.bottom < existing.top ||
                    box.top > existing.bottom
                ));

                if (!overlaps) {
                    placedWord = { ...word, x, y };
                    collisionBoxes.push(box);
                    break;
                }
            }

            if (!placedWord) {
                const fallbackY = padding + placedWords.reduce((sum, placed) => sum + placed.height + 16, 0);
                placedWord = {
                    ...word,
                    x: padding,
                    y: fallbackY
                };
                collisionBoxes.push({
                    left: padding - padding,
                    top: fallbackY - padding,
                    right: padding + word.width + padding,
                    bottom: fallbackY + word.height + padding
                });
            }

            placedWords.push(placedWord);
        });

        const minX = Math.min(...placedWords.map((word) => word.x));
        const minY = Math.min(...placedWords.map((word) => word.y));
        const maxX = Math.max(...placedWords.map((word) => word.x + word.width));
        const maxY = Math.max(...placedWords.map((word) => word.y + word.height));
        const usedWidth = maxX - minX;
        const usedHeight = maxY - minY;

        const translateX = Math.max(isPhone ? 12 : 22, (stageWidth - usedWidth) / 2) - minX;
        const translateY = variant === 'presentation'
            ? Math.max(isPhone ? 12 : 22, (stageHeight - usedHeight) / 2) - minY
            : 22 - minY;

        const positionedWords = placedWords.map((word) => ({
            ...word,
            x: word.x + translateX,
            y: word.y + translateY
        }));

        const contentHeight = Math.max(stageHeight, Math.ceil(Math.max(...positionedWords.map((word) => word.y + word.height)) + 24));

        stageHeight = contentHeight;

        return {
            words: positionedWords,
            stageHeight
        };
    }, [variant, viewportSize.height, viewportSize.width, words]);

    if (words.length === 0) {
        return (
            <div className="wordcloud-empty">
                <div className="wordcloud-empty-icon">Cloud</div>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`wordcloud-shell ${variant}`}>
            <div ref={viewportRef} className={`wordcloud-viewport ${variant}`}>
                {variant === 'card' ? (
                    <div className={`wordcloud-card-cluster ${cardWords.length <= 4 ? 'centered' : ''}`}>
                        {cardWords.map((word, index) => (
                            <motion.span
                                key={word.text}
                                className={`wordcloud-word-inline ${index < 3 ? 'major' : index < 10 ? 'strong' : 'regular'}`}
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.22,
                                    ease: 'easeOut',
                                    delay: Math.min(index * 0.02, 0.24)
                                }}
                                style={{
                                    fontSize: `${word.fontSize}px`,
                                    fontWeight: word.fontWeight,
                                    color: word.color
                                }}
                                title={tr('classroomEvent.wordCloudTopWordCount', '{{count}} responses', { count: word.count })}
                            >
                                {word.text}
                            </motion.span>
                        ))}
                    </div>
                ) : layout && (
                    <div className={`wordcloud-canvas ${variant}`} style={{ height: `${layout.stageHeight}px` }}>
                        {layout.words.map((word, index) => (
                            <motion.span
                                key={word.text}
                                className={`wordcloud-word ${index < 3 ? 'major' : index < 10 ? 'strong' : 'regular'}`}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.28,
                                    ease: 'easeOut',
                                    delay: Math.min(index * 0.02, 0.32)
                                }}
                                style={{
                                    left: `${word.x}px`,
                                    top: `${word.y}px`,
                                    fontSize: `${word.fontSize}px`,
                                    fontWeight: word.fontWeight,
                                    color: word.color
                                }}
                                title={tr('classroomEvent.wordCloudTopWordCount', '{{count}} responses', { count: word.count })}
                            >
                                <span>{word.text}</span>
                            </motion.span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordCloudViz;
