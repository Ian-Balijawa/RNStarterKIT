import React, { useRef } from 'react';
import { AppButton } from '../ui/AppButton';
export function AppSubmitButton({
  title = 'Submit',
  submitting,
  onSubmit,
}: {
  title?: string;
  submitting?: boolean;
  onSubmit: () => Promise<unknown> | unknown;
}) {
  const pending = useRef(false);
  const handlePress = async () => {
    if (pending.current || submitting) {
      return;
    }
    pending.current = true;
    try {
      await onSubmit();
    } finally {
      pending.current = false;
    }
  };
  return <AppButton title={title} loading={submitting} onPress={handlePress} />;
}
