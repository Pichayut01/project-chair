import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  setHours,
  setMinutes,
  parse
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import '../CSS/BeautifulDateTimePicker.css';

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const BeautifulDateTimePicker = ({ value, onChange, placeholder = "Select date & time" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef(null);

  // Parse current value or use safe default
  const selectedDate = useMemo(() => {
    if (!value) return null;
    try {
      return new Date(value);
    } catch (e) {
      return null;
    }
  }, [value]);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (day) => {
    let newDate = day;
    if (selectedDate) {
      newDate = setHours(newDate, selectedDate.getHours());
      newDate = setMinutes(newDate, selectedDate.getMinutes());
    } else {
      newDate = setHours(newDate, 23); // Default to end of day
      newDate = setMinutes(newDate, 59);
    }
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleTimeClick = (type, val) => {
    let newDate = selectedDate || new Date();
    if (type === 'hour') newDate = setHours(newDate, val);
    if (type === 'minute') newDate = setMinutes(newDate, val);
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const setDateToToday = () => {
    const now = new Date();
    const todayEnd = setHours(setMinutes(now, 59), 23);
    onChange(format(todayEnd, "yyyy-MM-dd'T'HH:mm"));
    setViewDate(now);
  };

  /* ─── Calendar Grid Logic ─── */
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  /* ─── Time Options ─── */
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="bdp-container" ref={containerRef}>
      <div className="bdp-input-wrapper" onClick={toggleOpen}>
        <input 
          type="text" 
          readOnly 
          className="bdp-input" 
          placeholder={placeholder}
          value={selectedDate ? format(selectedDate, 'PPP p') : ''}
        />
        <button type="button" className="bdp-icon-btn">
          <CalendarIcon />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="bdp-popover"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Calendar Part */}
            <div className="bdp-calendar">
              <div className="bdp-cal-header">
                <span className="bdp-month-year">{format(viewDate, 'MMMM yyyy')}</span>
                <div className="bdp-nav-btns">
                  <button type="button" className="bdp-nav-btn" onClick={() => setViewDate(subMonths(viewDate, 1))}><ChevronLeft /></button>
                  <button type="button" className="bdp-nav-btn" onClick={() => setViewDate(addMonths(viewDate, 1))}><ChevronRight /></button>
                </div>
              </div>

              <div className="bdp-weekdays">
                {weekdays.map(d => <div key={d} className="bdp-weekday">{d}</div>)}
              </div>

              <div className="bdp-days-grid">
                {days.map((day, i) => (
                  <div 
                    key={i} 
                    className={`bdp-day ${!isSameMonth(day, monthStart) ? 'bdp-day-other' : ''} ${isSameDay(day, new Date()) ? 'bdp-day-today' : ''} ${selectedDate && isSameDay(day, selectedDate) ? 'bdp-day-selected' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>

              <div className="bdp-footer">
                <button type="button" className="bdp-clear-btn" onClick={clearDate}>Clear</button>
                <button type="button" className="bdp-today-btn" onClick={setDateToToday}>Today</button>
              </div>
            </div>

            {/* Time Part */}
            <div className="bdp-time">
              <div className="bdp-time-header">Set Time</div>
              <div className="bdp-time-sections">
                <div className="bdp-time-col">
                  {hourOptions.map(h => (
                    <div 
                      key={h} 
                      className={`bdp-time-item ${selectedDate && selectedDate.getHours() === h ? 'bdp-time-item-selected' : ''}`}
                      onClick={() => handleTimeClick('hour', h)}
                    >
                      {h.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
                <div className="bdp-time-col">
                  {minuteOptions.map(m => (
                    <div 
                      key={m} 
                      className={`bdp-time-item ${selectedDate && selectedDate.getMinutes() === m ? 'bdp-time-item-selected' : ''}`}
                      onClick={() => handleTimeClick('minute', m)}
                    >
                      {m.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeautifulDateTimePicker;
