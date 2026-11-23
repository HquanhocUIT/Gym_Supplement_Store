import clsx from 'clsx';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ error, className = '', type = 'text', ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  // Dùng chung nút hiện mật khẩu cho mọi form, giữ nguyên giá trị và focus input.
  const field = (
    <input
      ref={ref}
      type={type === 'password' && visible ? 'text' : type}
      className={clsx(
        'min-h-11 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition-colors',
        error ? 'border-red-500' : 'border-gray-300',
        className,
        type === 'password' && 'pr-12'
      )}
      {...props}
    />
  );
  if (type !== 'password') return field;
  return (
    <div className="relative w-full">
      {field}
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex min-h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-50"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
