import { c } from '../theme.js';
import { toLocalDigits, formatLocalDisplay } from '../utils/phone.js';

/**
 * Indian mobile input — fixed +91 prefix, user types 10 digits only.
 * `value` / `onChange` use local digits (or E.164 from API; displayed stripped).
 */
export default function PhoneInput({ value, onChange, placeholder = '98765 43210', style, disabled }) {
  const local = toLocalDigits(value);

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        marginTop: 6,
        border: `1px solid ${c.line}`,
        borderRadius: 9,
        overflow: 'hidden',
        background: '#FCFAF5',
        ...style,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontSize: 14,
          fontWeight: 600,
          color: c.teal,
          background: '#F3F7F4',
          borderRight: `1px solid ${c.line}`,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        value={formatLocalDisplay(local)}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={11}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          padding: '11px 12px',
          fontSize: 14,
          background: 'transparent',
          color: c.charcoal,
          minWidth: 0,
        }}
      />
    </div>
  );
}
