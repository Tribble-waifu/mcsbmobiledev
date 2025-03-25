import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../themes/useTheme';
import Card from './Card';
import Button from './Button';

interface DateCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: { date: Date; color: string }[];
  onClose?: () => void;
  title?: string;
}

const DateCalendar: React.FC<DateCalendarProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  onClose,
  title,
}) => {
  const { theme, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  // Format date to YYYY-MM-DD for comparison
  const formatDateForComparison = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDateForComparison(date);
    
    // Check if date is outside min/max range
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    
    // Check if date is in disabled dates array
    return disabledDates.some(disabledDate => 
      formatDateForComparison(disabledDate) === dateStr
    );
  };

  // Get highlight color for a date if it exists
  const getHighlightColor = (date: Date): string | null => {
    const dateStr = formatDateForComparison(date);
    const highlighted = highlightedDates.find(
      item => formatDateForComparison(item.date) === dateStr
    );
    return highlighted ? highlighted.color : null;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Format month name
  const formatMonthName = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar data for the current month
  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const calendarData = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarData.push({ day: 0, date: null });
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarData.push({ day, date });
    }
    
    // Calculate remaining cells to complete the grid (7 columns)
    const totalCells = calendarData.length;
    const remainingCells = 7 - (totalCells % 7);
    
    // Add empty cells at the end if needed to complete the last row
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        calendarData.push({ day: 0, date: null });
      }
    }
    
    return calendarData;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    if (date && !isDateDisabled(date)) {
      onDateChange(date);
      if (onClose) {
        onClose();
      }
    }
  };

  // Render a calendar day
  const renderDay = ({ item }: { item: { day: number; date: Date | null } }) => {
    if (item.day === 0 || !item.date) {
      return <View style={styles.dayCell} />;
    }

    const date = item.date;
    const isSelected = selectedDate && formatDateForComparison(selectedDate) === formatDateForComparison(date);
    const isDisabled = isDateDisabled(date);
    const highlightColor = getHighlightColor(date);
    const isToday = formatDateForComparison(date) === formatDateForComparison(new Date());
    
    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          isSelected && styles.selectedCell,
          isToday && !isSelected && styles.todayCell,
          highlightColor && { borderColor: highlightColor, borderWidth: 1 }
        ]}
        onPress={() => handleDateSelect(date)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.dayText,
            { color: theme.colors.text.primary },
            isSelected && styles.selectedText,
            isDisabled && { color: theme.colors.text.secondary, opacity: 0.5 },
            isToday && !isSelected && styles.todayText
          ]}
        >
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render weekday headers
  const renderWeekdayHeaders = () => {
    const weekDays = ['Su', 'M', 'Tu', 'W', 'Th', 'Fr', 'Sa'];
    
    return (
      <View style={styles.weekdayHeader}>
        {weekDays.map(day => (
          <View key={day} style={styles.dayCell}>
            <Text style={[styles.weekdayText, { color: theme.colors.text.secondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.container} elevation={4}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthText, { color: theme.colors.text.primary }]}>
          {formatMonthName(currentMonth)}
        </Text>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {renderWeekdayHeaders()}
      
      <FlatList
        data={generateCalendarData()}
        renderItem={renderDay}
        keyExtractor={(item, index) => `day-${index}`}
        numColumns={7}
        scrollEnabled={false}
        style={styles.calendarGrid}
      />
      
      <View style={styles.footer}>
        <Button 
          title="Today" 
          onPress={() => {
            const today = new Date();
            setCurrentMonth(today);
            handleDateSelect(today);
          }}
          variant="outline"
          size="small"
          style={styles.todayButton}
        />
        
        {onClose && (
          <Button 
            title="Close" 
            onPress={onClose}
            variant="text"
            size="small"
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    padding: 0,
    overflow: 'hidden',
    borderRadius: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarGrid: {
    padding: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  selectedCell: {
    backgroundColor: '#2196F3',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 16,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayCell: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  todayText: {
    fontWeight: '700',
    color: '#2196F3',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  todayButton: {
    marginRight: 8,
  },
});

export default DateCalendar;