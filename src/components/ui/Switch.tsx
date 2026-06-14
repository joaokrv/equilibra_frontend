interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

/** Toggle acessível (role=switch). Controlado: estado vem do pai. */
export const Switch = ({ checked, onChange, disabled = false, label, id }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-primary' : 'bg-foreground/15'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-foreground shadow transition-transform ${
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
    />
  </button>
);
