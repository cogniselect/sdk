import { createStyledElement } from './dom-utils';

export class DownloadConfirmationUI {
  private static overlayElement: HTMLDivElement | null = null;

  public static show(
    modelSize: string,
    onConfirm: () => void,
    onCancel: () => void
  ): void {
    if (DownloadConfirmationUI.overlayElement) {
      return;
    }

    DownloadConfirmationUI.overlayElement = createStyledElement('div', {
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
    }, 'Download AI Model');

    const description = createStyledElement('p', {
      fontSize: '14px',
      margin: '0 0 24px',
    },
      `It will download a model of size ${modelSize} MB. This model will be cached locally in your browser. No data leaves your device.`
    );

    const buttonContainer = createStyledElement('div', {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      marginTop: '16px',
    });

    const confirmButton = createStyledElement('button', {
      padding: '8px 16px',
      background: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }, 'Download') as HTMLButtonElement;

    confirmButton.addEventListener('click', onConfirm);

    const cancelButton = createStyledElement('button', {
      padding: '8px 16px',
      background: '#fff',
      color: '#000',
      border: '1px solid #000',
      borderRadius: '4px',
      cursor: 'pointer',
    }, 'Cancel') as HTMLButtonElement;

    cancelButton.addEventListener('click', onCancel);

    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);

    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(buttonContainer);

    DownloadConfirmationUI.overlayElement.appendChild(container);
    document.body.appendChild(DownloadConfirmationUI.overlayElement);
  }

  public static hide(): void {
    if (!DownloadConfirmationUI.overlayElement) {
      return;
    }

    document.body.removeChild(DownloadConfirmationUI.overlayElement);
    DownloadConfirmationUI.overlayElement = null;
  }
} 