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
  headerAction?: { label: string; onPress: () => void; destructive?: boolean };
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
  headerAction,
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
  const header = title ? (
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="heading" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </AppText>
      {headerAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={headerAction.label}
          onPress={headerAction.onPress}
          hitSlop={8}
          style={styles.closeButton}>
          <AppText variant="label" style={{ color: headerAction.destructive ? colors.danger : colors.primary }}>
            {headerAction.label}
          </AppText>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
        onPress={onDismiss}
        hitSlop={8}
        style={styles.closeButton}>
        <AppText variant="label" style={{ color: colors.primary }}>Close</AppText>
      </Pressable>
    </View>
  ) : null;
  const content = (
    <BottomSheetInputContext.Provider value>
      <View style={styles.content}>{children}</View>
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
      keyboardBehavior="extend"
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
          keyboardDismissMode="interactive"
          stickyHeaderIndices={title ? [0] : undefined}
          contentContainerStyle={[
            styles.scrollContent,
            footer ? styles.scrollWithFooter : undefined,
          ]}>
          {header}
          {content}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView>{header}{content}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flex: 1, minWidth: 0 },
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
