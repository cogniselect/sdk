import type { Action } from '../types';
import { ActionEditorUI } from './action-editor';
import { createStyledElement } from './dom-utils';
import { deleteModelAllInfoInCache } from '@mlc-ai/web-llm';
import type { AppConfig } from '@mlc-ai/web-llm';

export class StatusMenuUI {
  private static menuElement: HTMLDivElement | null = null;
  private static progressContainer: HTMLDivElement | null = null;
  private static progressBar: HTMLDivElement | null = null;
  private static downloadButton: HTMLButtonElement | null = null;

  public static show(
    anchorEl: HTMLElement,
    isInitialized: boolean,
    getModelSize: (modelId: string) => Promise<string>,
    downloadAndActivate: (totalMB: number, onProgress: (loaded: number, total: number) => void) => Promise<void>,
    actions: Action[],
    onSave: (actions: Action[]) => void,
    modelId: string,
    cacheStrategy: string,
    modelList: any[],
    cacheExists: boolean,
    disableCallback: () => Promise<void> | void
  ): HTMLDivElement {
    if (StatusMenuUI.menuElement) {
      StatusMenuUI.hide();
    }

    const rect = anchorEl.getBoundingClientRect();
    const menu = createStyledElement('div', {
      position: 'fixed',
      bottom: `${window.innerHeight - rect.top + 8}px`,
      right: `${window.innerWidth - rect.right + 8}px`,
      background: '#fff',
      border: '1px solid #000',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: '10001',
      padding: '8px',
      fontFamily: 'Arial, sans-serif',
      minWidth: '200px',
      maxWidth: '150px',
    }) as HTMLDivElement;

    if (!isInitialized) {
      StatusMenuUI.downloadButton = createStyledElement('button', {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontSize: '14px',
        padding: '4px 8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        marginBottom: '4px',
      }, 'Enable') as HTMLButtonElement;

      // Create progress container (initially hidden)
      StatusMenuUI.progressContainer = createStyledElement('div', {
        width: '100%',
        display: 'none',
        padding: '8px',
        boxSizing: 'border-box',
      });

      const barContainer = createStyledElement('div', {
        width: '100%',
        height: '10px',
        background: '#eee',
        borderRadius: '5px',
        overflow: 'hidden',
        border: '1px solid #ddd',
      });

      StatusMenuUI.progressBar = createStyledElement('div', {
        background: 'linear-gradient(to right, #000, #333)',
        height: '100%',
        width: '0%',
        borderRadius: '4px',
        transition: 'width 0.3s ease-out',
      });
      
      barContainer.appendChild(StatusMenuUI.progressBar);
      StatusMenuUI.progressContainer.appendChild(barContainer);

      StatusMenuUI.downloadButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log('Download button clicked');
        if (StatusMenuUI.downloadButton) {
          StatusMenuUI.downloadButton.style.display = 'none';
        }
        if (StatusMenuUI.progressContainer) {
          StatusMenuUI.progressContainer.style.display = 'block';
        }

        try {
          const modelSizeStr = await getModelSize(modelId);
          console.log('Model size:', modelSizeStr);
          const totalMB = parseInt(modelSizeStr);
          
          // Force initial progress update to show 0%
          StatusMenuUI.updateProgress(0, totalMB);
          
          await downloadAndActivate(totalMB, (loaded, total) => {
            console.log(`Progress: ${loaded}/${total} MB`);
            StatusMenuUI.updateProgress(loaded, total);
          });
          // Re-render menu now that the model is running to show Disable in proper position
          StatusMenuUI.show(
            anchorEl,
            true,
            getModelSize,
            downloadAndActivate,
            actions,
            onSave,
            modelId,
            cacheStrategy,
            modelList,
            cacheExists,
            disableCallback
          );
        } catch (error: any) {
          console.error('Download failed:', error);
          // Alert user based on error type
          if (error instanceof Error && error.name === 'WebGPUNotAvailableError') {
            alert(error.message);
          } else if (error instanceof Error) {
            alert('Failed to download model: ' + error.message);
          } else {
            alert('Failed to download model.');
          }
          // Show download button again on error
          if (StatusMenuUI.downloadButton) {
            StatusMenuUI.downloadButton.style.display = 'block';
          }
          if (StatusMenuUI.progressContainer) {
            StatusMenuUI.progressContainer.style.display = 'none';
          }
        }
      });

      // Clear cache option
      const clearCacheBtn = createStyledElement('button', {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontSize: '14px',
        padding: '4px 8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        marginBottom: '4px',
      }, 'Clear cache') as HTMLButtonElement;
      clearCacheBtn.disabled = !cacheExists;
      clearCacheBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const appConfig: AppConfig = {
          useIndexedDBCache: cacheStrategy === 'persistent',
          model_list: modelList,
        };
        await deleteModelAllInfoInCache(modelId, appConfig);
        clearCacheBtn.disabled = true;
        if (StatusMenuUI.downloadButton) {
          StatusMenuUI.downloadButton.textContent = 'Enable';
        }
      });

      menu.appendChild(StatusMenuUI.downloadButton);
      menu.appendChild(StatusMenuUI.progressContainer);
      menu.appendChild(clearCacheBtn);
    }

    // When already initialized, offer disable option
    if (isInitialized) {
      const disableBtn = createStyledElement('button', {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontSize: '14px',
        padding: '4px 8px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        marginBottom: '4px',
      }, 'Disable') as HTMLButtonElement;
      disableBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await disableCallback();
        } catch (err) {
          console.error('Disable failed:', err);
        }
        // Re-render menu now that the model is disabled to show Enable
        StatusMenuUI.show(
          anchorEl,
          false,
          getModelSize,
          downloadAndActivate,
          actions,
          onSave,
          modelId,
          cacheStrategy,
          modelList,
          cacheExists,
          disableCallback
        );
      });
      menu.appendChild(disableBtn);
    }

    const editBtn = createStyledElement('button', {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      padding: '4px 8px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      marginBottom: '4px',
    }, 'Edit actions') as HTMLButtonElement;
    editBtn.addEventListener('click', () => {
      ActionEditorUI.show(actions, onSave);
    });
    menu.appendChild(editBtn);

    const divider = document.createElement('hr');
    menu.appendChild(divider);

    const statusText = isInitialized ? 'Status: Running' : 'Status: Not running';
    const statusEl = createStyledElement('div', { 
      padding: '8px', 
      fontSize: '12px', 
      color: '#555'
    }, statusText);
    statusEl.classList.add('status-text');
    menu.appendChild(statusEl);

    // Tip under status (wrapped) that toggles visibility
    const tipEl = createStyledElement('div', {
      padding: '8px',
      fontSize: '12px',
      color: '#555',
      whiteSpace: 'normal',
      fontWeight: 'bold',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
    }, 'Tip: Highlight text and right-click to reveal CogniSelect menu');
    tipEl.classList.add('status-tip');
    tipEl.style.display = isInitialized ? 'block' : 'none';
    menu.appendChild(tipEl);

    document.body.appendChild(menu);
    StatusMenuUI.menuElement = menu;

    return menu;
  }

  public static updateProgress(loaded: number, total: number): void {
    if (!StatusMenuUI.progressBar) {
      return;
    }

    const percent = total > 0 ? Math.min(Math.round((loaded / total) * 100), 100) : 0;
    StatusMenuUI.progressBar.style.width = `${percent}%`;
  }

  public static hide(): void {
    if (!StatusMenuUI.menuElement) {
      return;
    }

    document.body.removeChild(StatusMenuUI.menuElement);
    StatusMenuUI.menuElement = null;
    StatusMenuUI.progressContainer = null;
    StatusMenuUI.progressBar = null;
    StatusMenuUI.downloadButton = null;
  }
} 