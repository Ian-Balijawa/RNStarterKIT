import React from 'react';
import {
  Control,
  FieldPath,
  FieldValues,
  useController,
} from 'react-hook-form';
import { AppTextInput } from './AppTextInput';
export function ControlledTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: Omit<
  React.ComponentProps<typeof AppTextInput>,
  'value' | 'onChangeText' | 'label'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
}) {
  const { field, fieldState } = useController({ control, name });
  return (
    <AppTextInput
      {...props}
      label={label}
      value={field.value == null ? '' : String(field.value)}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
}
