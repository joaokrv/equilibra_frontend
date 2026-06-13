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

    const focusables = getFocusables();
    const autofocusElement = focusables.find((node) => node.hasAttribute('autofocus') || (node as any).autofocus);
    const firstInput = focusables.find((node) => node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT');

    if (autofocusElement) {
      autofocusElement.focus();
    } else if (firstInput) {
      firstInput.focus();
    } else if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      el.focus();
    }

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
