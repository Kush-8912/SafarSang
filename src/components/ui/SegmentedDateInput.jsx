import { useRef } from 'react';

export const isDmy = (v) => /^\d{2}-\d{2}-\d{4}$/.test(v || '');

export const dmyToYmd = (v) => {
  if (!isDmy(v)) return '';
  const [dd, mm, yyyy] = v.split('-').map(Number);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  const isRealDate =
    date.getUTCFullYear() === yyyy &&
    date.getUTCMonth() === mm - 1 &&
    date.getUTCDate() === dd;
  if (!isRealDate) return '';
  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
};

export const ymdToDmy = (v) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
  const [yyyy, mm, dd] = v.split('-');
  return `${dd}-${mm}-${yyyy}`;
};

const getParts = (value) => {
  const [day = '', month = '', year = ''] = String(value || '').split('-');
  return { day: day.slice(0, 2), month: month.slice(0, 2), year: year.slice(0, 4) };
};

const SegmentedDateInput = ({ id, value, onChange, required = false, ariaLabel = 'Date' }) => {
  const refs = useRef([null, null, null]);
  const nativeDateRef = useRef(null);
  const parts = getParts(value);

  const focusPart = (index) => {
    const el = refs.current[index];
    if (!el) return;
    el.focus();
    el.select();
  };

  const updatePart = (part, raw) => {
    const maxLen = part === 'year' ? 4 : 2;
    const cleaned = String(raw || '').replace(/\D/g, '').slice(0, maxLen);
    const next = { ...parts, [part]: cleaned };
    onChange(`${next.day}-${next.month}-${next.year}`);
  };

  const onPartKeyDown = (index, e) => {
    const input = e.currentTarget;
    const atStart = input.selectionStart === 0;
    const atEnd = input.selectionStart === input.value.length;

    if ((e.key === 'ArrowRight' || e.key === '/' || e.key === '-') && index < 2 && atEnd) {
      e.preventDefault();
      focusPart(index + 1);
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0 && atStart) {
      e.preventDefault();
      focusPart(index - 1);
      return;
    }
    if (e.key === 'Backspace' && !input.value && index > 0) {
      e.preventDefault();
      focusPart(index - 1);
    }
  };

  const openCalendar = () => {
    const el = nativeDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.click();
  };

  return (
    <div className="segdate-wrap" role="group" aria-label={ariaLabel}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className="form-input segdate-part"
        placeholder="DD"
        value={parts.day}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          updatePart('day', v);
          if (v.length === 2) focusPart(1);
        }}
        onKeyDown={(e) => onPartKeyDown(0, e)}
        ref={(el) => { refs.current[0] = el; }}
        maxLength={2}
        required={required}
      />
      <span className="segdate-sep">/</span>
      <input
        type="text"
        inputMode="numeric"
        className="form-input segdate-part"
        placeholder="MM"
        value={parts.month}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          updatePart('month', v);
          if (v.length === 2) focusPart(2);
        }}
        onKeyDown={(e) => onPartKeyDown(1, e)}
        ref={(el) => { refs.current[1] = el; }}
        maxLength={2}
        required={required}
      />
      <span className="segdate-sep">/</span>
      <input
        type="text"
        inputMode="numeric"
        className="form-input segdate-part segdate-year"
        placeholder="YYYY"
        value={parts.year}
        onChange={(e) => updatePart('year', e.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={(e) => onPartKeyDown(2, e)}
        ref={(el) => { refs.current[2] = el; }}
        maxLength={4}
        required={required}
      />
      <button type="button" className="segdate-calendar-btn" onClick={openCalendar} aria-label={`${ariaLabel} calendar`}>
        📅
      </button>
      <input
        ref={nativeDateRef}
        type="date"
        value={dmyToYmd(value)}
        onChange={(e) => onChange(ymdToDmy(e.target.value))}
        className="segdate-native"
        min="0001-01-01"
        max="9999-12-31"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

export default SegmentedDateInput;
