import { useEffect, useRef } from 'react';

/**
 * Acessibilidade de modal: marca o elemento como dialog (role/aria-modal), prende o foco (focus trap),
 * fecha com Esc e restaura o foco anterior ao fechar. Basta anexar o ref retornado ao painel do modal.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = ref.current;
    if (!el) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');

    const getFocusables = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null);

    (getFocusables()[0] ?? el).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Mobile: ao focar um campo, rola-o para o centro para não ficar atrás do teclado virtual.
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.matches('input, textarea, select')) {
        setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
      }
    };

    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('focusin', onFocusIn);
    return () => {
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('focusin', onFocusIn);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  return ref;
}
