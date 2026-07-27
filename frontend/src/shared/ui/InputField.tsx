import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type Ref,
} from 'react';

import { cn } from '../lib/cn';

type InputFieldProps = {
  id: string;
  label: string;
  error?: string | undefined;
  errorId?: string | undefined;
  containerClassName?: string | undefined;
  labelClassName?: string | undefined;
  inputClassName?: string | undefined;
  showCharacterCount?: boolean | undefined;
} & Omit<ComponentPropsWithRef<'input'>, 'id'>;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
}

function lengthFromProps(
  props: Pick<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue'>,
): number {
  if (typeof props.value === 'string') return props.value.length;
  if (typeof props.defaultValue === 'string') return props.defaultValue.length;
  return 0;
}

export function InputField({
  id,
  label,
  error,
  errorId,
  containerClassName,
  labelClassName,
  inputClassName,
  showCharacterCount,
  ...inputProps
}: InputFieldProps) {
  const { onChange, onBlur, ref, value, defaultValue, ...restInputProps } = inputProps;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localCharCount, setLocalCharCount] = useState(() =>
    lengthFromProps({ value, defaultValue }),
  );
  // Contrôlé : dérivé du value. Non contrôlé : mis à jour via ref / onChange.
  const charCount = typeof value === 'string' ? value.length : localCharCount;

  const handleRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
      if (node && showCharacterCount && typeof value !== 'string') {
        setLocalCharCount(node.value.length);
      }
    },
    [ref, showCharacterCount, value],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (showCharacterCount && typeof value !== 'string') {
        setLocalCharCount(event.target.value.length);
      }
      onChange?.(event);
    },
    [onChange, showCharacterCount, value],
  );

  const describedBy = error ? errorId : restInputProps['aria-describedby'];
  const maxLen =
    typeof restInputProps.maxLength === 'number' && restInputProps.maxLength >= 0
      ? restInputProps.maxLength
      : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 text-left', containerClassName)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className={cn(
            'text-xs font-semibold uppercase tracking-wide text-gray-500',
            labelClassName,
          )}
        >
          {label}
        </label>
        {showCharacterCount && maxLen !== undefined ? (
          <span className="whitespace-nowrap text-xs tabular-nums text-gray-400" aria-live="polite">
            {charCount}/{maxLen}
          </span>
        ) : null}
      </div>
      <input
        id={id}
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-70',
          error && 'border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100',
          inputClassName,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        ref={handleRef}
        onChange={handleChange}
        onBlur={onBlur}
        value={value}
        defaultValue={defaultValue}
        {...restInputProps}
      />
      {error ? (
        <p id={errorId} className="m-0 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
