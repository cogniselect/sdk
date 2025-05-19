import type { Action } from './types';
import { ContextMenuUI } from './ui/context-menu';

/**
 * Processor to handle context menu interactions and actions.
 */
export class ContextMenuProcessor {
  private engine: any;
  private actions: Action[];

  constructor(engine: any, actions: Action[]) {
    this.engine = engine;
    this.actions = actions;
  }

  /**
   * Attaches event listeners for context menu and click outside.
   */
  public attach(): void {
    document.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('click', this.onClickOutside);
  }

  /**
   * Detaches event listeners.
   */
  public detach(): void {
    document.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('click', this.onClickOutside);
  }

  private onContextMenu = (event: MouseEvent): void => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) {
      ContextMenuUI.hide();
      return;
    }

    event.preventDefault();
    ContextMenuUI.show(
      event.clientX,
      event.clientY,
      selectedText,
      this.actions,
      this.handleAction
    );
  };

  private onClickOutside = (event: MouseEvent): void => {
    const menuElement = ContextMenuUI.getElement();
    if (menuElement && !menuElement.contains(event.target as Node)) {
      ContextMenuUI.hide();
    }
  };

  private handleAction = async (action: Action, selection: string): Promise<void> => {
    // Delegate UI work to ContextMenuUI.processAction
    await ContextMenuUI.processAction(this.engine, this.actions, action, selection);
  };

  /**
   * Creates a styled HTML element.
   */
  private createStyledElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    styles: Partial<CSSStyleDeclaration>,
    textContent?: string
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    Object.assign(element.style, styles);
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }

  /**
   * Updates the actions list for context menu.
   * @param actions New array of actions.
   */
  public updateActions(actions: Action[]): void {
    this.actions = actions;
  }
} 