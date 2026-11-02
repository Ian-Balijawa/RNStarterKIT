import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AppBottomSheet } from './AppBottomSheet';

export type AppSheetOptions = {
  title?: string;
  children: React.ReactNode;
  snapPoints?: Array<string | number>;
  scrollable?: boolean;
};
type SheetContextValue = {
  showSheet: (options: AppSheetOptions) => void;
  hideSheet: () => void;
};
const SheetContext = createContext<SheetContextValue | null>(null);

/** One sheet host for the whole app; use showSheet from any screen. */
export function AppBottomSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<AppSheetOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const showSheet = useCallback((options: AppSheetOptions) => {
    setRequest(options);
    setVisible(true);
  }, []);
  const hideSheet = useCallback(() => setVisible(false), []);
  const context = useMemo(
    () => ({ showSheet, hideSheet }),
    [showSheet, hideSheet],
  );
  return (
    <SheetContext.Provider value={context}>
      {children}
      <AppBottomSheet
        visible={visible}
        onDismiss={() => {
          setVisible(false);
          setRequest(null);
        }}
        title={request?.title}
        snapPoints={request?.snapPoints}
        scrollable={request?.scrollable}>
        {request?.children}
      </AppBottomSheet>
    </SheetContext.Provider>
  );
}

export function useAppBottomSheet() {
  const value = useContext(SheetContext);
  if (!value) {
    throw new Error('Wrap the app in AppBottomSheetProvider');
  }
  return value;
}
