// Figma "SU/Button", "SU/Mini Button", "SU/Field", "SU/Checkbox"에 맞춘 입력 조각.
// 글자가 커지거나 글꼴이 바뀌어도 잘리지 않게 고정 height 대신 min-height + padding, 줄바꿈 허용.

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertIcon, CheckIcon } from './icons';

export function PrimaryButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  // 디자인 명세는 흰 글자지만 분홍 위 흰 글자는 대비 2.6:1이라 ink 글자(6.5:1)를 쓴다. (열린 질문)
  return (
    <button
      type="button"
      {...rest}
      className={`flex min-h-[52px] w-full items-center justify-center rounded-xl px-5 py-3 text-base font-bold transition
        enabled:bg-brand enabled:text-ink enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:bg-lavender disabled:text-ink-sub ${className}`}
    >
      {children}
    </button>
  );
}

export function MiniButton({ done, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { done?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`min-h-[48px] shrink-0 whitespace-nowrap rounded-[10px] border px-4 py-2 text-sm font-bold transition
        ${done ? 'border-brand-soft bg-brand-soft text-ink' : 'border-line bg-surface text-ink enabled:hover:border-brand enabled:hover:bg-page'}
        disabled:cursor-not-allowed disabled:text-ink-sub ${done ? '' : 'disabled:bg-surface'}`}
    >
      {children}
    </button>
  );
}

export type MessageKind = 'ok' | 'error' | 'info';
export function FieldMessage({ id, kind, children }: { id: string; kind?: MessageKind; children?: ReactNode }) {
  const color = kind === 'ok' ? 'text-success' : kind === 'error' ? 'text-danger' : 'text-ink-sub';
  return (
    <p id={id} aria-live="polite" className={`mt-1.5 flex min-h-[1.25rem] items-start gap-1 text-[13px] font-medium ${color}`}>
      {children && kind === 'ok' && <span className="mt-[0.2em]"><CheckIcon size={12} /></span>}
      {children && kind === 'error' && <span className="mt-[0.15em]"><AlertIcon /></span>}
      {children}
    </p>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  required?: boolean;
  invalid?: boolean;
  action?: ReactNode;
  trailing?: ReactNode;
  message?: ReactNode;
  messageKind?: MessageKind;
  extra?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, required, invalid, action, trailing, message, messageKind, extra, className = '', ...input },
  ref,
) {
  const msgId = `${id}-msg`;
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
        {required && <span className="ml-0.5 text-accent" aria-hidden="true">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-[1_1_12em]">
          <input
            ref={ref}
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={msgId}
            aria-required={required || undefined}
            {...input}
            className={`min-h-[48px] w-full rounded-xl border-[1.5px] bg-surface px-3.5 py-2.5 text-base outline-none transition placeholder:text-ink-placeholder
              read-only:bg-page read-only:text-ink-sub focus:border-brand
              ${invalid ? 'border-danger' : 'border-line'} ${trailing ? 'pr-14' : ''} ${className}`}
          />
          {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
        </div>
        {action}
      </div>
      {extra}
      <FieldMessage id={msgId} kind={messageKind}>{message}</FieldMessage>
    </div>
  );
});

export function Checkbox({ checked, onChange, label, className = '', ...rest }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'>) {
  return (
    <label className={`flex min-h-tap cursor-pointer items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-[22px] w-[22px] shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          {...rest}
          className="peer h-[22px] w-[22px] cursor-pointer appearance-none rounded-[7px] border-2 border-line bg-surface checked:border-brand checked:bg-brand"
        />
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-ink peer-checked:flex">
          <CheckIcon size={13} />
        </span>
      </span>
      {label}
    </label>
  );
}
