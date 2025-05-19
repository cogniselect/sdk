import { createStyledElement } from './dom-utils';

export class DownloadProgressUI {
  private static overlayElement: HTMLDivElement | null = null;
  private static progressBar: HTMLDivElement | null = null;
  private static percentText: HTMLDivElement | null = null;
  private static mbText: HTMLDivElement | null = null;
  private static speedText: HTMLParagraphElement | null = null;
  private static lastLoaded = 0;
  private static lastTime = 0;

  public static show(modelId: string, totalMB: number): void {
    if (DownloadProgressUI.overlayElement) {
      return;
    }

    DownloadProgressUI.overlayElement = createStyledElement('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10001',
    });

    const container = createStyledElement('div', {
      background: '#fff',
      border: '1px solid #000',
      borderRadius: '8px',
      width: '400px',
      padding: '24px',
      boxSizing: 'border-box',
      textAlign: 'center',
    });

    const title = createStyledElement('h2', {
      fontSize: '20px',
      fontWeight: '700',
      margin: '0 0 16px',
    }, 'Downloading AI Model');

    const description = createStyledElement('p', {
      fontSize: '14px',
      margin: '0 0 16px',
    },
      `Downloading ${modelId} model for browser-based inference.`
    );

    const barContainer = createStyledElement('div', {
      width: '100%',
      height: '12px',
      background: '#eee',
      borderRadius: '4px',
      margin: '0 0 8px',
    });

    DownloadProgressUI.progressBar = createStyledElement('div', {
      background: '#000',
      height: '100%',
      width: '0%',
      borderRadius: '4px',
      transition: 'width 0.3s ease-out',
    });
    barContainer.appendChild(DownloadProgressUI.progressBar);

    const infoRow = createStyledElement('div', {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px',
      margin: '0 0 8px',
    });
    DownloadProgressUI.percentText = createStyledElement('div', {}, '0% complete');
    DownloadProgressUI.mbText = createStyledElement('div', {}, `0 MB / ${totalMB} MB`);
    infoRow.appendChild(DownloadProgressUI.percentText);
    infoRow.appendChild(DownloadProgressUI.mbText);

    DownloadProgressUI.lastLoaded = 0;
    DownloadProgressUI.lastTime = Date.now();

    DownloadProgressUI.speedText = createStyledElement('p', {
      fontSize: '12px',
      color: '#555',
      margin: '0 0 8px',
    }, '0.0 MB/s');

    const note = createStyledElement('p', {
      fontSize: '12px',
      color: '#6b7280',
      margin: '0',
    }, 'This model will be cached locally in your browser. No data leaves your device.');

    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(barContainer);
    container.appendChild(infoRow);
    container.appendChild(DownloadProgressUI.speedText);
    container.appendChild(note);

    DownloadProgressUI.overlayElement.appendChild(container);
    document.body.appendChild(DownloadProgressUI.overlayElement);
  }

  public static update(loaded: number, total: number): void {
    if (!DownloadProgressUI.progressBar || !DownloadProgressUI.percentText || !DownloadProgressUI.mbText || !DownloadProgressUI.speedText) {
      return;
    }

    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    DownloadProgressUI.progressBar.style.width = `${percent}%`;
    DownloadProgressUI.percentText.textContent = `${percent}% complete`;
    DownloadProgressUI.mbText.textContent = `${loaded.toFixed(1)} MB / ${total} MB`;

    const now = Date.now();
    const dt = (now - DownloadProgressUI.lastTime) / 1000;
    const dLoaded = loaded - DownloadProgressUI.lastLoaded;
    const speed = dt > 0 ? dLoaded / dt : 0;
    DownloadProgressUI.speedText.textContent = `${speed.toFixed(1)} MB/s`;

    DownloadProgressUI.lastTime = now;
    DownloadProgressUI.lastLoaded = loaded;
  }

  public static hide(): void {
    if (!DownloadProgressUI.overlayElement) {
      return;
    }

    document.body.removeChild(DownloadProgressUI.overlayElement);
    DownloadProgressUI.overlayElement = null;
    DownloadProgressUI.progressBar = null;
    DownloadProgressUI.percentText = null;
    DownloadProgressUI.mbText = null;
    DownloadProgressUI.speedText = null;
  }
} 