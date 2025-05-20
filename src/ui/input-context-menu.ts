import { createStyledElement } from './dom-utils';

export class InputContextMenuUI {
  private static menuElement: HTMLDivElement | null = null;
  private static promptOverlay: HTMLDivElement | null = null;
  private static messageHistory: { role: string; content: string }[] = [];
  private static followupCount = 0;
  private static engine: any = null;
  private static inputEl: HTMLInputElement | HTMLTextAreaElement | null = null;

  public static show(
    x: number,
    y: number,
    inputEl: HTMLInputElement | HTMLTextAreaElement,
    engine: any
  ): void {
    InputContextMenuUI.hide();
    InputContextMenuUI.engine = engine;
    InputContextMenuUI.inputEl = inputEl;
    InputContextMenuUI.messageHistory = [];
    InputContextMenuUI.followupCount = 0;

    const menu = createStyledElement('div', {
      position: 'fixed',
      top: `${y}px`,
      left: `${x}px`,
      background: '#fff',
      border: '1px solid #000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px',
      zIndex: '10000',
      fontFamily: 'Arial, sans-serif',
      minWidth: '200px',
    }) as HTMLDivElement;

    const createItem = (text: string, onClick: () => void): HTMLDivElement => {
      const item = createStyledElement('div', {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontSize: '14px',
        padding: '4px 8px',
        border: 'none',
        backgroundColor: 'transparent',
        appearance: 'none',
        outline: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: '4px',
      }, text) as HTMLDivElement;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      item.addEventListener('mouseenter', () => { item.style.backgroundColor = '#f0f0f0'; });
      item.addEventListener('mouseleave', () => { item.style.backgroundColor = 'transparent'; });
      return item;
    };

    // Copy action
    menu.appendChild(createItem('Copy', async () => {
      const start = inputEl.selectionStart ?? 0;
      const end = inputEl.selectionEnd ?? 0;
      const text = start !== end ? inputEl.value.substring(start, end) : inputEl.value;
      await navigator.clipboard.writeText(text);
      InputContextMenuUI.hide();
    }));

    // Paste action
    menu.appendChild(createItem('Paste', async () => {
      const clip = await navigator.clipboard.readText();
      const start = inputEl.selectionStart ?? 0;
      const end = inputEl.selectionEnd ?? 0;
      const newVal = inputEl.value.slice(0, start) + clip + inputEl.value.slice(end);
      inputEl.value = newVal;
      const cursorPos = start + clip.length;
      inputEl.setSelectionRange(cursorPos, cursorPos);
      inputEl.focus();
      InputContextMenuUI.hide();
    }));

    // Generate action
    menu.appendChild(createItem('Generate', () => {
      InputContextMenuUI.hide();
      InputContextMenuUI.showPrompt();
    }));

    document.body.appendChild(menu);
    InputContextMenuUI.menuElement = menu;
  }

  public static hide(): void {
    if (InputContextMenuUI.menuElement) {
      document.body.removeChild(InputContextMenuUI.menuElement);
      InputContextMenuUI.menuElement = null;
    }
    if (InputContextMenuUI.promptOverlay) {
      document.body.removeChild(InputContextMenuUI.promptOverlay);
      InputContextMenuUI.promptOverlay = null;
    }
  }

  private static showPrompt(): void {
    if (!InputContextMenuUI.inputEl || !InputContextMenuUI.engine) return;
    const rect = InputContextMenuUI.inputEl.getBoundingClientRect();
    const panel = createStyledElement('div', {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      background: '#fff',
      border: '1px solid #000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px',
      zIndex: '10000',
      fontFamily: 'Arial, sans-serif',
      minWidth: '240px',
    }) as HTMLDivElement;
    // Follow-up input
    const wrapper = createStyledElement('div', { display: 'flex', gap: '6px', alignItems: 'center' });
    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    promptInput.placeholder = 'Generate...';
    Object.assign(promptInput.style, { flex: '1', padding: '0px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', height: '40px' });
    const askBtn = createStyledElement('button', { padding: '4px 12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }, 'Generate') as HTMLButtonElement;
    wrapper.appendChild(promptInput);
    wrapper.appendChild(askBtn);
    panel.appendChild(wrapper);
    // Examples
    const ex = createStyledElement('div', { fontSize: '12px', color: '#666', marginTop: '4px' }, 'Examples: "Generate me a ticket for X"');
    panel.appendChild(ex);
    document.body.appendChild(panel);
    InputContextMenuUI.promptOverlay = panel;
    promptInput.focus();
    // Handle ask
    let followups = 0;
    const maxFollowups = 5;
    const update = async () => {
      const q = promptInput.value.trim(); if (!q || followups >= maxFollowups) return;
      promptInput.value = '';
      followups++;
      InputContextMenuUI.messageHistory.push({ role: 'user', content: q });
      try {
        const chunks = await InputContextMenuUI.engine.chat.completions.create({
          messages: InputContextMenuUI.messageHistory,
          temperature: 0.7,
          stream: true
        });
        let full = '';
        for await (const chunk of chunks) {
          full += chunk.choices[0]?.delta?.content || '';
          InputContextMenuUI.inputEl!.value = full;
        }
        InputContextMenuUI.messageHistory.push({ role: 'assistant', content: full });
      } catch (err) {
        console.error(err);
      }
      if (followups >= maxFollowups) { promptInput.disabled = true; askBtn.disabled = true; }
      promptInput.focus();
    };
    askBtn.addEventListener('click', update);
    promptInput.addEventListener('keydown', e => { if (e.key === 'Enter') update(); });
  }

  // Get the current input context menu element for outside click checks
  public static getMenuElement(): HTMLDivElement | null {
    return InputContextMenuUI.menuElement;
  }

  // Get the current prompt overlay element for outside click checks
  public static getPromptOverlay(): HTMLDivElement | null {
    return InputContextMenuUI.promptOverlay;
  }
} 