import { createStyledElement } from './dom-utils';

export class IndicatorUI {
  private static wrapper: HTMLDivElement | null = null;
  private static statusText: HTMLDivElement | null = null;

  public static create(container: HTMLElement, onClick: () => void): HTMLDivElement {
    if (IndicatorUI.wrapper) {
      IndicatorUI.hide();
    }

    const wrapper = createStyledElement('div', {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#fff',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      cursor: 'pointer',
      zIndex: '10000',
    });

    const icon = createStyledElement('div', {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: '#fff',
      border: '2px solid #000',
      boxShadow: '0 0 4px rgba(0,0,0,0.1)',
    });

    const status = createStyledElement('div', {
      fontSize: '12px',
      color: '#555',
    }, 'CogniSelect');

    wrapper.appendChild(icon);
    wrapper.appendChild(status);
    wrapper.addEventListener('click', onClick);
    container.appendChild(wrapper);

    IndicatorUI.wrapper = wrapper;
    IndicatorUI.statusText = status;

    return wrapper;
  }

  public static updateStatus(text: string): void {
    if (!IndicatorUI.statusText) {
      return;
    }
    IndicatorUI.statusText.textContent = text;
  }

  public static hide(): void {
    if (!IndicatorUI.wrapper || !IndicatorUI.wrapper.parentElement) {
      return;
    }
    
    IndicatorUI.wrapper.parentElement.removeChild(IndicatorUI.wrapper);
    IndicatorUI.wrapper = null;
    IndicatorUI.statusText = null;
  }
} 