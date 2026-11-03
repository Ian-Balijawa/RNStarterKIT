import React, { useCallback, useEffect, useRef } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: Array<string | number>;
  scrollable?: boolean;
};
const DEFAULT_SNAP_POINTS = ['50%', '85%'];

/** A controlled modal sheet. Mount this inside BottomSheetModalProvider. */
export function AppBottomSheet({
  visible,
  onDismiss,
  children,
  title,
  snapPoints = DEFAULT_SNAP_POINTS,
  scrollable = false,
}: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const presentedRef = useRef(false);
  const { colors, radius } = useAppTheme();
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
    <View style={styles.content}>
      {title ? <AppText variant="heading">{title}</AppText> : null}
      {children}
    </View>
  );
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      backdropComponent={backdrop}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}>
      {scrollable ? (
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
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
  scrollContent: { paddingBottom: 24 },
});
