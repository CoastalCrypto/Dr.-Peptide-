import React, { useRef, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  swipeDirection?: 'down' | 'up' | 'both';
  closeOnBackdropPress?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  fullScreen?: boolean;
}

export function SwipeableModal({
  visible,
  onClose,
  children,
  swipeDirection = 'down',
  closeOnBackdropPress = true,
  animationType = 'slide',
  fullScreen = false,
}: SwipeableModalProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;

  const resetPosition = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [translateY]);

  const closeModal = useCallback(() => {
    const direction = swipeDirection === 'up' ? -1 : 1;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT * direction,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onClose();
    });
  }, [translateY, onClose, swipeDirection]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        const { dy, dx } = gestureState;
        const isVerticalSwipe = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10;
        
        if (!isVerticalSwipe) return false;
        
        // Check swipe direction permission
        if (swipeDirection === 'down' && dy < 0) return false;
        if (swipeDirection === 'up' && dy > 0) return false;
        
        return true;
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        
        // Apply resistance when swiping in wrong direction
        if (swipeDirection === 'down' && dy < 0) {
          translateY.setValue(dy * 0.3);
        } else if (swipeDirection === 'up' && dy > 0) {
          translateY.setValue(dy * 0.3);
        } else {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const { dy, vy } = gestureState;
        
        const shouldClose =
          Math.abs(dy) > SWIPE_THRESHOLD ||
          Math.abs(vy) > SWIPE_VELOCITY_THRESHOLD;
        
        const isValidDirection =
          (swipeDirection === 'down' && dy > 0) ||
          (swipeDirection === 'up' && dy < 0) ||
          swipeDirection === 'both';
        
        if (shouldClose && isValidDirection) {
          closeModal();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const styles = createStyles(colors, fullScreen);

  // Web doesn't support PanResponder well, so we skip gesture handling on web
  const gestureHandlers = Platform.OS === 'web' ? {} : panResponder.panHandlers;

  return (
    <Modal
      visible={visible}
      transparent={!fullScreen}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY }],
                },
              ]}
              {...gestureHandlers}
            >
              {/* Swipe Indicator */}
              <View style={styles.swipeIndicatorContainer}>
                <View style={styles.swipeIndicator} />
              </View>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (colors: any, fullScreen: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: fullScreen ? colors.background : 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: fullScreen ? 0 : 24,
      borderTopRightRadius: fullScreen ? 0 : 24,
      maxHeight: fullScreen ? '100%' : '90%',
      minHeight: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 20,
    },
    swipeIndicatorContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    swipeIndicator: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
  });

export default SwipeableModal;
