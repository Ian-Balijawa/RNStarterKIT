import React from 'react';
import { AppSelect } from '../../../components/forms/AppSelect';
import { ChoiceRow } from './ChoiceRow';

type Option<T extends string> = { label: string; value: T };

export function LedgerChoiceField<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  if (options.length <= 3) {
    return (
      <ChoiceRow
        label={label}
        options={options}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <AppSelect
      label={label}
      options={options}
      value={value}
      searchable={options.length > 6}
      onChange={next => {
        if (typeof next === 'string') onChange(next as T);
      }}
    />
  );
}
