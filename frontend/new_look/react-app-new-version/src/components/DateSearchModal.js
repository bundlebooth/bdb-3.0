import React, { useState, useEffect } from 'react';
import UniversalModal from './UniversalModal';
import './DateSearchModal.css';

const DateSearchModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  initialStartDate, 
  initialEndDate,
  initialStartTime,
  initialEndTime 
}) => {
  const [selectedDate, setSelectedDate] = useState(initialStartDate || '');
  const [startTime, setStartTime] = useState(initialStartTime || '');
  const [endTime, setEndTime] = useState(initialEndTime || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialStartDate || '');
      setStartTime(initialStartTime || '');
      setEndTime(initialEndTime || '');
      // Set current month to show the selected date if exists
      if (initialStartDate) {
        const [year, month] = initialStartDate.split('-').map(Number);
        setCurrentMonth(new Date(year, month - 1, 1));
      } else {
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, initialStartDate, initialStartTime, initialEndTime]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (!date || date < new Date().setHours(0, 0, 0, 0)) return;
    const dateStr = formatDateString(date);
    setSelectedDate(dateStr);
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return formatDateString(date) === selectedDate;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < new Date().setHours(0, 0, 0, 0);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleApply = () => {
    onApply({
      startDate: selectedDate,
      endDate: selectedDate,
      startTime,
      endTime
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedDate('');
    setStartTime('');
    setEndTime('');
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select availability"
      size="medium"
      primaryAction={{ label: 'Save date', onClick: handleApply }}
      secondaryAction={{ label: 'Delete date', onClick: handleClear, variant: 'text' }}
    >
      <div className="date-search-content">
        {/* Left side - Calendar */}
        <div className="date-search-calendar">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav-btn" type="button">
              <i className="fas fa-chevron-left"></i>
            </button>
            <h3 className="calendar-title">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={handleNextMonth} className="calendar-nav-btn" type="button">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            {dayNames.map((day) => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            
            {days.map((date, index) => (
              <button
                key={index}
                type="button"
                className={`calendar-day ${
                  date ? (
                    isDateSelected(date) ? 'selected' : 
                    isDateDisabled(date) ? 'disabled' : 'available'
                  ) : 'empty'
                }`}
                onClick={() => handleDateClick(date)}
                disabled={!date || isDateDisabled(date)}
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Right side - Date display and Time Selection */}
        <div className="date-search-sidebar">
          {/* Selected Date Display */}
          <div className="selected-date-display">
            {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
          </div>

          {/* Time Selection */}
          <div className="time-input-group">
            <label>Start time</label>
            <select 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)}
              className="time-select"
            >
              <option value="">Select time</option>
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
            <label>End time</label>
            <select 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              className="time-select"
            >
              <option value="">Select time</option>
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

          {/* Timezone indicator */}
          <div className="timezone-indicator">
            <i className="fas fa-globe"></i>
            <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};

export default DateSearchModal;
