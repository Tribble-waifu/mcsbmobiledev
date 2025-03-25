import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Import theme
import useTheme from '../themes/useTheme';

interface YearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectYear: (year: number) => void;
  selectedYear: number;
  minYear?: number;
  maxYear?: number;
}

const YearPickerModal: React.FC<YearPickerModalProps> = ({
  visible,
  onClose,
  onSelectYear,
  selectedYear,
  minYear = 1970,
  maxYear = 2050
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Calculate initial decade based on selected year
  const initialDecade = Math.floor(selectedYear / 10) * 10;
  const [currentDecade, setCurrentDecade] = useState(initialDecade);
  
  // Reset decade when selected year changes
  React.useEffect(() => {
    setCurrentDecade(Math.floor(selectedYear / 10) * 10);
  }, [selectedYear]);
  
  // Navigation functions
  const goToPreviousDecade = useCallback(() => {
    setCurrentDecade(prev => prev - 10);
  }, []);
  
  const goToNextDecade = useCallback(() => {
    setCurrentDecade(prev => prev + 10);
  }, []);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.yearPickerModal, { backgroundColor: theme.colors.card.background }]}>
          <View style={styles.yearPickerHeader}>
            <Text style={[styles.yearPickerTitle, { color: theme.colors.text.primary }]}>
              {t('common.selectYear', 'Select Year')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarYearContainer}>
            {/* Decade Navigation */}
            <View style={styles.decadeNavigation}>
              <TouchableOpacity 
                style={styles.decadeNavButton}
                onPress={goToPreviousDecade}
              >
                <Text style={{ 
                  color: theme.colors.text.secondary, 
                  fontSize: 18 
                }}>«</Text>
              </TouchableOpacity>
              
              <Text style={[styles.decadeTitle, { color: theme.colors.text.primary }]}>
                {`${currentDecade}-${currentDecade + 9}`}
              </Text>
              
              <TouchableOpacity 
                style={styles.decadeNavButton}
                onPress={goToNextDecade}
              >
                <Text style={{ 
                  color: theme.colors.text.secondary, 
                  fontSize: 18 
                }}>»</Text>
              </TouchableOpacity>
            </View>
            
            {/* Year Grid */}
            <View style={styles.yearGrid}>
              {Array.from({ length: 12 }, (_, i) => {
                const year = (currentDecade - 1) + i;
                const isCurrentDecade = year >= currentDecade && year <= currentDecade + 9;
                const isSelected = year === selectedYear;
                
                return (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearGridItem,
                      !isCurrentDecade && styles.yearOutOfRange,
                      isSelected && [
                        styles.yearSelected, 
                        { backgroundColor: theme.colors.primary }
                      ],
                    ]}
                    onPress={() => {
                      onSelectYear(year);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.yearGridText,
                        { color: theme.colors.text.primary },
                        !isCurrentDecade && { color: theme.colors.text.secondary },
                        isSelected && { color: '#fff' }
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  yearPickerModal: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarYearContainer: {
    marginVertical: 8,
  },
  decadeNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  decadeNavButton: {
    padding: 8,
  },
  decadeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearGridItem: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  yearGridText: {
    fontSize: 16,
  },
  yearOutOfRange: {
    opacity: 0.5,
  },
  yearSelected: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});

export default YearPickerModal;