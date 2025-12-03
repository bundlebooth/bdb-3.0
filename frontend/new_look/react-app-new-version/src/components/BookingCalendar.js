import React, { useState, useEffect } from 'react';
import './Calendar.css';

const BookingCalendar = ({ 
  selectedDate, 
  onDateSelect, 
  onClose, 
  startTime, 
  endTime, 
  onTimeChange,
  vendorAvailability = null // { businessHours: [], exceptions: [], bookings: [] }
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localStartTime, setLocalStartTime] = useState(startTime || '11:00');
  const [localEndTime, setLocalEndTime] = useState(endTime || '17:00');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (date && !isDateDisabled(date)) {
      // Format date in local timezone to avoid UTC conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onDateSelect(`${year}-${month}-${day}`);
      // Don't close - let user select times
    }
  };

  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setLocalStartTime(value);
      if (onTimeChange) {
        onTimeChange('start', value);
      }
    } else {
      setLocalEndTime(value);
      if (onTimeChange) {
        onTimeChange('end', value);
      }
    }
  };

  const calculateDuration = () => {
    if (!localStartTime || !localEndTime) return '0 hours';
    const [startHour, startMin] = localStartTime.split(':').map(Number);
    const [endHour, endMin] = localEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = (endMinutes - startMinutes) / 60;
    return `${duration} hour${duration !== 1 ? 's' : ''} selected`;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    // Format date in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === selectedDate;
  };

  // Check if date is disabled based on vendor availability
  const isDateDisabled = (date) => {
    if (!date) return true;
    
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If no availability data provided, only disable past dates
    if (!vendorAvailability) {
      console.log('No vendor availability data');
      return false;
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = date.toISOString().split('T')[0];

    // Check availability exceptions first (specific dates marked as unavailable)
    if (vendorAvailability.exceptions && vendorAvailability.exceptions.length > 0) {
      const exception = vendorAvailability.exceptions.find(ex => {
        const exDate = new Date(ex.Date);
        return exDate.toISOString().split('T')[0] === dateString && !ex.IsAvailable;
      });
      if (exception) {
        console.log(`Date ${dateString} disabled by exception`);
        return true; // Date is explicitly unavailable
      }
    }

    // Check business hours for this day of week
    if (vendorAvailability.businessHours && vendorAvailability.businessHours.length > 0) {
      const dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === dayOfWeek);
      
      // Debug logging
      console.log(`Checking day ${dayOfWeek} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}):`, dayHours);
      
      if (!dayHours) {
        console.log(`No business hours found for day ${dayOfWeek}`);
        return true; // No hours defined for this day, assume closed
      }
      
      // Check IsAvailable field (could be boolean or bit)
      const isAvailable = dayHours.IsAvailable === true || dayHours.IsAvailable === 1;
      if (!isAvailable) {
        console.log(`Vendor closed on day ${dayOfWeek}`);
        return true; // Vendor is closed on this day
      }
    } else {
      console.log('No business hours data available');
    }

    return false;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="calendar-popup">
      {/* Close button at top right */}
      <button onClick={onClose} className="calendar-close-x" title="Close">
        <i className="fas fa-times"></i>
      </button>
      
      <div className="calendar-content">
        {/* Left side - Calendar */}
        <div className="calendar-left">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav-btn">
              <i className="fas fa-chevron-left"></i>
            </button>
            <h3 className="calendar-title">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={handleNextMonth} className="calendar-nav-btn">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            {dayNames.map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => (
              <button
                key={index}
                className={`calendar-day ${
                  date ? (isDateSelected(date) ? 'selected' : isDateDisabled(date) ? 'disabled' : 'available') : 'empty'
                }`}
                onClick={() => handleDateClick(date)}
                disabled={!date || isDateDisabled(date)}
                title={date && isDateDisabled(date) ? 'Vendor not available' : ''}
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>
          
          {vendorAvailability && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#0369a1'
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
              Only dates when vendor is available are shown
            </div>
          )}
        </div>

        {/* Right side - Time Selection - Always show */}
        <div className="calendar-right">
          <div className="time-selection">
            <div className="time-duration">{calculateDuration()}</div>
            
            <div className="time-inputs">
            <div className="time-input-group">
              <label>
                <i className="fas fa-clock"></i> Start time
              </label>
              <select 
                value={localStartTime} 
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="time-select"
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const min = i % 2 === 0 ? '00' : '30';
                  const time = `${hour.toString().padStart(2, '0')}:${min}`;
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const period = hour < 12 ? 'AM' : 'PM';
                  return (
                    <option key={time} value={time}>
                      {displayHour}:{min} {period}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="time-input-group">
              <label>
                <i className="fas fa-clock"></i> End time
              </label>
              <select 
                value={localEndTime} 
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="time-select"
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const min = i % 2 === 0 ? '00' : '30';
                  const time = `${hour.toString().padStart(2, '0')}:${min}`;
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const period = hour < 12 ? 'AM' : 'PM';
                  return (
                    <option key={time} value={time}>
                      {displayHour}:{min} {period}
                    </option>
                  );
                })}
              </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
