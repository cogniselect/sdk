import type { Action } from '../types';
import { createStyledElement } from './dom-utils';

export class ActionEditorUI {
  private static overlayElement: HTMLDivElement | null = null;
  private static actions: Action[] = [];

  public static show(
    initialActions: Action[],
    onSave: (actions: Action[]) => void
  ): void {
    if (ActionEditorUI.overlayElement) {
      return;
    }

    ActionEditorUI.actions = [...initialActions];

    ActionEditorUI.overlayElement = createStyledElement('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10002',
    }) as HTMLDivElement;

    const container = createStyledElement('div', {
      background: '#fff',
      borderRadius: '8px',
      padding: '16px',
      width: '500px',
      maxHeight: '80%',
      overflowY: 'auto',
      boxSizing: 'border-box',
    });

    const title = createStyledElement('h2', {
      margin: '0 0 16px',
    }, 'Edit Actions');
    container.appendChild(title);

    const listEl = createStyledElement('div', {});
    container.appendChild(listEl);

    const render = () => {
      listEl.innerHTML = '';
      ActionEditorUI.actions.forEach((action, idx) => {
        const actionDiv = createStyledElement('div', {
          border: '1px solid #ccc',
          padding: '8px',
          marginBottom: '8px',
          borderRadius: '4px',
          position: 'relative',
        });

        const removeBtn = createStyledElement('button', {
          position: 'absolute',
          top: '4px',
          right: '4px',
          border: 'none',
          background: 'transparent',
          fontSize: '16px',
          cursor: 'pointer',
        }, '×');
        removeBtn.addEventListener('click', () => {
          ActionEditorUI.actions.splice(idx, 1);
          render();
        });
        actionDiv.appendChild(removeBtn);

        const categoryInput = createStyledElement('input', {
          width: '100%',
          marginBottom: '4px',
          padding: '4px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          boxSizing: 'border-box',
        }) as HTMLInputElement;
        categoryInput.value = action.category;
        categoryInput.placeholder = 'Category';
        actionDiv.appendChild(categoryInput);

        const descriptionInput = createStyledElement('input', {
          width: '100%',
          marginBottom: '4px',
          padding: '4px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          boxSizing: 'border-box',
        }) as HTMLInputElement;
        descriptionInput.value = action.description;
        descriptionInput.placeholder = 'Description';
        actionDiv.appendChild(descriptionInput);

        const promptInput = createStyledElement('input', {
          width: '100%',
          marginBottom: '4px',
          padding: '4px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          boxSizing: 'border-box',
        }) as HTMLInputElement;
        promptInput.value = action.prompt;
        promptInput.placeholder = 'Prompt';
        actionDiv.appendChild(promptInput);

        listEl.appendChild(actionDiv);
      });
    };

    render();

    const addBtn = createStyledElement('button', {
      display: 'inline-block',
      marginBottom: '16px',
      padding: '8px 16px',
      background: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    }, 'Add Action');
    addBtn.addEventListener('click', () => {
      ActionEditorUI.actions.push({ category: '', description: '', prompt: '' });
      render();
    });
    container.appendChild(addBtn);

    const btnContainer = createStyledElement('div', {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
    });

    const cancelBtn = createStyledElement('button', {
      padding: '8px 16px',
      background: '#fff',
      color: '#000',
      border: '1px solid #000',
      borderRadius: '4px',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    }, 'Cancel') as HTMLButtonElement;
    cancelBtn.addEventListener('click', () => {
      ActionEditorUI.hide();
    });

    const saveBtn = createStyledElement('button', {
      padding: '8px 16px',
      background: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    }, 'Save') as HTMLButtonElement;
    saveBtn.addEventListener('click', () => {
      const newActions: Action[] = [];
      listEl.querySelectorAll('div').forEach(div => {
        const inputs = div.querySelectorAll('input');
        const cat = (inputs[0] as HTMLInputElement).value.trim();
        const desc = (inputs[1] as HTMLInputElement).value.trim();
        const prm = (inputs[2] as HTMLInputElement).value.trim();
        if (cat && desc && prm) {
          newActions.push({ category: cat, description: desc, prompt: prm });
        }
      });
      onSave(newActions);
      ActionEditorUI.hide();
    });
    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(saveBtn);
    container.appendChild(btnContainer);

    ActionEditorUI.overlayElement.appendChild(container);
    document.body.appendChild(ActionEditorUI.overlayElement);
  }

  public static hide(): void {
    if (!ActionEditorUI.overlayElement) {
      return;
    }
    document.body.removeChild(ActionEditorUI.overlayElement);
    ActionEditorUI.overlayElement = null;
  }
} 