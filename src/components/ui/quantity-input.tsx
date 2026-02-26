import * as React from "react";
import CurrencyInputField from "react-currency-input-field";
import { cn } from "@/lib/utils";

interface QuantityInputProps {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  decimalsLimit?: number;
}

const QuantityInput = React.forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ className, value, onValueChange, placeholder = "0", decimalsLimit = 4, disabled, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState<string>('');
    const isUserTyping = React.useRef(false);
    const isFocused = React.useRef(false);

    React.useEffect(() => {
      const shouldSync = disabled || (!isUserTyping.current && !isFocused.current);

      if (shouldSync && value !== undefined && value !== null) {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          const formatted = value.toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalsLimit,
            useGrouping: false,
          });
          setLocalValue(formatted);
        } else if (typeof value === 'string' && value !== 'NaN') {
          setLocalValue(value);
        } else {
          setLocalValue('');
        }
      } else if (shouldSync && (value === undefined || value === null || value === 0)) {
        setLocalValue('');
      }
    }, [value, decimalsLimit, disabled]);

    return (
      <CurrencyInputField
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        value={localValue}
        disabled={disabled}
        onFocus={() => {
          isFocused.current = true;
        }}
        onValueChange={(stringValue, _, values) => {
          if (disabled) return;

          isUserTyping.current = true;
          setLocalValue(stringValue || '');

          if (!stringValue || stringValue.trim() === '') {
            onValueChange?.(undefined);
            setTimeout(() => { isUserTyping.current = false; }, 100);
            return;
          }

          if (stringValue.endsWith(',') || stringValue.endsWith('.')) {
            setTimeout(() => { isUserTyping.current = false; }, 100);
            return;
          }

          const floatValue = values?.float;
          if (floatValue !== undefined && floatValue !== null && !isNaN(floatValue)) {
            onValueChange?.(floatValue);
          }

          setTimeout(() => { isUserTyping.current = false; }, 100);
        }}
        onBlur={() => {
          isUserTyping.current = false;
          isFocused.current = false;

          if (value !== undefined && value !== null) {
            if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
              const formatted = value.toLocaleString('pt-BR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimalsLimit,
                useGrouping: false,
              });
              setLocalValue(formatted);
            } else if (typeof value === 'string' && value !== 'NaN') {
              setLocalValue(value as string);
            } else {
              setLocalValue('');
            }
          }
        }}
        placeholder={placeholder}
        decimalsLimit={decimalsLimit}
        decimalSeparator=","
        disableGroupSeparators={true}
        allowNegativeValue={false}
        transformRawValue={(raw) => (raw || '').replace('.', ',')}
        {...props}
      />
    );
  }
);

QuantityInput.displayName = "QuantityInput";

export { QuantityInput };
