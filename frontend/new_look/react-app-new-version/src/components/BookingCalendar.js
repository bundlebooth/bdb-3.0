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
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

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
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('📅 Date clicked:', date);
      console.log('📅 Day of week:', date.getDay(), ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]);
      console.log('📅 Formatted date:', formattedDate);
      
      onDateSelect(formattedDate);
      
      // Update available time slots based on business hours for this day
      updateAvailableTimeSlots(date);
      // Don't close - let user select times
    }
  };

  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setLocalStartTime(value);
      if (onTimeChange) {
        onTimeChange('start', value);
      }
      
      // If end time is before or equal to new start time, adjust it
      const [startHour, startMin] = value.split(':').map(Number);
      const [endHour, endMin] = localEndTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        // Find next available slot after start time
        const nextSlotIndex = availableTimeSlots.findIndex(slot => slot === value) + 1;
        if (nextSlotIndex < availableTimeSlots.length) {
          const newEndTime = availableTimeSlots[nextSlotIndex];
          setLocalEndTime(newEndTime);
          if (onTimeChange) {
            onTimeChange('end', newEndTime);
          }
        }
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
  // Get available time slots for a given date based on business hours
  const updateAvailableTimeSlots = (date) => {
    console.log('🕐 updateAvailableTimeSlots called for date:', date);
    
    if (!date || !vendorAvailability?.businessHours) {
      console.log('⚠️ No date or business hours available');
      setAvailableTimeSlots([]);
      return;
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    console.log('📅 Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);
    console.log('📋 All business hours:', vendorAvailability.businessHours);
    
    const dayHours = vendorAvailability.businessHours.find(bh => bh.DayOfWeek === dayOfWeek);
    console.log('🔍 Found business hours for this day:', dayHours);
    
    if (!dayHours || !dayHours.IsAvailable) {
      console.log('❌ Vendor not available on this day');
      setAvailableTimeSlots([]);
      return;
    }

    // Parse OpenTime and CloseTime (can be ISO timestamp or time string)
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      
      // Ensure timeStr is a string
      if (typeof timeStr !== 'string') {
        // If it's a Date object, extract time
        if (timeStr instanceof Date) {
          return {
            hour: timeStr.getHours(),
            minute: timeStr.getMinutes()
          };
        }
        // If it's an object with hour/minute, return as-is
        if (typeof timeStr === 'object' && timeStr.hour !== undefined) {
          return timeStr;
        }
        // Try to convert to string
        timeStr = String(timeStr);
      }
      
      // Check if it's an ISO timestamp (contains 'T')
      if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        // Use local time (getHours) instead of UTC to respect timezone
        return {
          hour: date.getHours(),
          minute: date.getMinutes()
        };
      }
      
      // Otherwise parse as time string "HH:MM:SS"
      const parts = timeStr.split(':');
      return {
        hour: parseInt(parts[0]),
        minute: parseInt(parts[1] || 0)
      };
    };

    const openTime = parseTime(dayHours.OpenTime);
    const closeTime = parseTime(dayHours.CloseTime);
    console.log('⏰ Open time:', openTime, 'Close time:', closeTime);

    if (!openTime || !closeTime) {
      console.log('❌ Invalid open/close times');
      setAvailableTimeSlots([]);
      return;
    }

    // Generate time slots in 30-minute intervals within business hours (including close time)
    const slots = [];
    let currentHour = openTime.hour;
    let currentMinute = openTime.minute;

    const closeMinutes = closeTime.hour * 60 + closeTime.minute;

    while (true) {
      const currentMinutes = currentHour * 60 + currentMinute;
      if (currentMinutes > closeMinutes) break; // Changed >= to > to include close time

      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeStr);

      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    console.log('✅ Generated time slots:', slots);
    setAvailableTimeSlots(slots);
    
    // Update start and end times if they're outside business hours
    if (slots.length > 0) {
      const startTimeInSlots = slots.includes(localStartTime);
      const endTimeInSlots = slots.includes(localEndTime);
      
      console.log('🔄 Current start time:', localStartTime, 'in slots?', startTimeInSlots);
      console.log('🔄 Current end time:', localEndTime, 'in slots?', endTimeInSlots);
      
      if (!startTimeInSlots) {
        const newStartTime = slots[0];
        console.log('⚡ Adjusting start time to:', newStartTime);
        setLocalStartTime(newStartTime);
        if (onTimeChange) {
          onTimeChange('start', newStartTime);
        }
      }
      
      if (!endTimeInSlots) {
        const newEndTime = slots[Math.min(6, slots.length - 1)]; // Default to 6 slots (3 hours) or last slot
        console.log('⚡ Adjusting end time to:', newEndTime);
        setLocalEndTime(newEndTime);
        if (onTimeChange) {
          onTimeChange('end', newEndTime);
        }
      }
    }
  };

  // Update available time slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      updateAvailableTimeSlots(date);
    }
  }, [selectedDate, vendorAvailability]);

  // Sync local times with parent props
  useEffect(() => {
    if (startTime && startTime !== localStartTime) {
      setLocalStartTime(startTime);
    }
    if (endTime && endTime !== localEndTime) {
      setLocalEndTime(endTime);
    }
  }, [startTime, endTime]);

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
      
      <div className="calendar-section">
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
    </div>
  );
};

export default BookingCalendar;
