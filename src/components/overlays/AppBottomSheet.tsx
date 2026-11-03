import React, { useCallback, useEffect, useRef } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { BottomSheetInputContext } from './BottomSheetInputContext';

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: Array<string | number>;
  scrollable?: boolean;
  footer?: React.ReactNode;
};
const DEFAULT_SNAP_POINTS = ['60%', '100%'];

/** A controlled modal sheet. Mount this inside BottomSheetModalProvider. */
export function AppBottomSheet({
  visible,
  onDismiss,
  children,
  title,
  snapPoints = DEFAULT_SNAP_POINTS,
  scrollable = false,
  footer,
}: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const presentedRef = useRef(false);
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (visible && !presentedRef.current) {
      presentedRef.current = true;
      ref.current?.present();
    } else if (!visible && presentedRef.current) {
      ref.current?.dismiss();
    }
  }, [visible]);
  const handleDismiss = useCallback(() => {
    presentedRef.current = false;
    onDismiss();
  }, [onDismiss]);
  const backdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );
  const content = (
    <BottomSheetInputContext.Provider value>
      <View style={styles.content}>
        {title ? (
          <View style={styles.header}>
            <AppText variant="heading" style={styles.headerTitle}>
              {title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
              onPress={onDismiss}
              hitSlop={8}
              style={styles.closeButton}>
              <AppText variant="label" style={{ color: colors.primary }}>
                Close
              </AppText>
            </Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </BottomSheetInputContext.Provider>
  );
  const renderFooter = useCallback(
    (props: React.ComponentProps<typeof BottomSheetFooter>) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [colors.border, colors.surface, footer, insets.bottom],
  );
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      topInset={insets.top}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={handleDismiss}
      backdropComponent={backdrop}
      footerComponent={footer ? renderFooter : undefined}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}>
      {scrollable ? (
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            footer ? styles.scrollWithFooter : undefined,
          ]}>
          {content}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView>{content}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { flex: 1 },
  closeButton: { minHeight: 44, justifyContent: 'center' },
  scrollContent: { paddingBottom: 24 },
  scrollWithFooter: { paddingBottom: 152 },
  footer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
});
