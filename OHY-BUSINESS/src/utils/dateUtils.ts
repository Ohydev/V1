/**
 * Date and Time Utility Functions
 * Handles conversion between frontend formats and API formats
 * API expects dates in Y-m-d format (YYYY-MM-DD) for requests and returns d-m-Y format in responses
 * API expects times in H:i:s format for requests
 */

/**
 * Convert date to API format (Y-m-d / YYYY-MM-DD)
 * @param date - Date object or string in YYYY-MM-DD format
 * @returns Date string in Y-m-d format (e.g., "2025-12-15")
 * Note: API expects YYYY-MM-DD format for save_event_step_1 request
 */
export const formatDateForAPI = (date: Date | string): string => {
  // Check if date is string or Date object
  let dateObj: Date;
  if (typeof date === 'string') {
    // Parse string date (YYYY-MM-DD format from form)
    const [year, month, day] = date.split('-');
    dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Use Date object directly
    dateObj = date;
  }
  
  // Extract year, month, day
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // Return in Y-m-d format (YYYY-MM-DD) for API request
  return `${year}-${month}-${day}`;
};

/**
 * Convert time to API format (H:i:s)
 * @param time - Time string in HH:MM format (from HTML time input)
 * @returns Time string in H:i:s format (e.g., "09:00:00")
 */
export const formatTimeForAPI = (time: string): string => {
  // Check if time is already in H:i:s format
  if (time.includes(':') && time.split(':').length === 3) {
    // Already in correct format
    return time;
  }
  
  // Convert from HH:MM to H:i:s
  // Split time string by colon
  const parts = time.split(':');
  // Get hours and minutes
  const hours = parts[0] || '00';
  const minutes = parts[1] || '00';
  // Add seconds (always 00 for time inputs)
  return `${hours}:${minutes}:00`;
};

/**
 * Parse date from API format (d-m-Y) to Date object
 * @param dateString - Date string in d-m-Y format (e.g., "15-12-2025")
 * @returns Date object
 */
export const parseDateFromAPI = (dateString: string): Date => {
  // Split date string by dash
  const [day, month, year] = dateString.split('-');
  // Create Date object (month is 0-indexed)
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

/**
 * Parse date from API format (d-m-Y) to YYYY-MM-DD string format
 * Used for setting form values (form expects strings, not Date objects)
 * @param dateString - Date string in d-m-Y format (e.g., "15-12-2025")
 * @returns Date string in YYYY-MM-DD format (e.g., "2025-12-15")
 */
export const parseDateFromAPIToString = (dateString: string): string => {
  // Split date string by dash
  const [day, month, year] = dateString.split('-');
  // Format as YYYY-MM-DD for form storage
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Convert date from YYYY-MM-DD (form input) to d-m-Y format for API requests
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date string in d-m-Y format (e.g., "15-12-2025")
 */
export const formatDateToDMY = (dateString: string): string => {
  // Return empty string if input is empty or null
  if (!dateString || dateString.trim() === "") {
    return "";
  }
  
  // Split date string by dash
  const parts = dateString.split('-');
  
  // Validate that we have exactly 3 parts (year, month, day)
  if (parts.length !== 3) {
    console.error('Invalid date format for formatDateToDMY:', dateString);
    // If already in d-m-Y format, return as is (safety check)
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      // Already in d-m-Y format, return as is
      return dateString;
    }
    return "";
  }
  
  // Extract year, month, day (expecting YYYY-MM-DD format)
  const [year, month, day] = parts;
  
  // Validate that year is 4 digits (YYYY format)
  if (year.length !== 4) {
    console.error('Invalid year format in date:', dateString);
    // If already in d-m-Y format (year is last), return as is
    if (day.length === 4) {
      return dateString;
    }
    return "";
  }
  
  // Convert to d-m-Y format
  return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
};

/**
 * Parse time from API format (H:i) to HH:MM format
 * @param timeString - Time string in H:i format (e.g., "09:00")
 * @returns Time string in HH:MM format
 */
export const parseTimeFromAPI = (timeString: string): string => {
  // Check if time includes seconds
  if (timeString.includes(':') && timeString.split(':').length === 3) {
    // Remove seconds (last part)
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  // Already in HH:MM format
  return timeString;
};

