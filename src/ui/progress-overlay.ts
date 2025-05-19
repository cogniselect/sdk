import { createStyledElement } from './dom-utils';

export class ProgressOverlayUI {
  private static overlayElement: HTMLDivElement | null = null;
  private static progressElement: HTMLDivElement | null = null;

  public static show(): void {
    if (ProgressOverlayUI.overlayElement) {
      return;
    }

    ProgressOverlayUI.overlayElement = createStyledElement('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
    });

    ProgressOverlayUI.progressElement = createStyledElement('div', {
      width: '60%',
      height: '24px',
      background: '#eee',
      position: 'relative',
    });

    const bar = createStyledElement('div', {
      background: '#3b82f6',
      height: '100%',
      width: '0%',
    });
    bar.id = 'cogniselect-progress-bar';

    ProgressOverlayUI.progressElement.appendChild(bar);
    ProgressOverlayUI.overlayElement.appendChild(ProgressOverlayUI.progressElement);
    document.body.appendChild(ProgressOverlayUI.overlayElement);
  }

  public static update(loaded: number, total: number): void {
    if (!ProgressOverlayUI.progressElement) {
      return;
    }

    const bar = ProgressOverlayUI.progressElement.querySelector('#cogniselect-progress-bar') as HTMLElement | null;
    if (!bar) {
      return;
    }

    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    bar.style.width = `${percent}%`;
  }

  public static hide(): void {
    if (!ProgressOverlayUI.overlayElement) {
      return;
    }

    document.body.removeChild(ProgressOverlayUI.overlayElement);
    ProgressOverlayUI.overlayElement = null;
    ProgressOverlayUI.progressElement = null;
  }
} 