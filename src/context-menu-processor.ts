import type { Action } from './types';
import { ContextMenuUI } from './ui/context-menu';
import { InputContextMenuUI } from './ui/input-context-menu';

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
    // If right-click on an input or textarea, show input-specific menu
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      event.preventDefault();
      ContextMenuUI.hide();
      InputContextMenuUI.show(event.clientX, event.clientY, target as HTMLInputElement | HTMLTextAreaElement, this.engine);
      return;
    }
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
    const targetNode = event.target as Node;
    // Ignore clicks inside the input context menu
    const inputMenu = InputContextMenuUI.getMenuElement();
    if (inputMenu && inputMenu.contains(targetNode)) {
      return;
    }
    // Ignore clicks inside the prompt overlay
    const promptOverlay = InputContextMenuUI.getPromptOverlay();
    if (promptOverlay && promptOverlay.contains(targetNode)) {
      return;
    }
    // Hide both context menus when clicking outside
    InputContextMenuUI.hide();
    const menuElement = ContextMenuUI.getElement();
    // Also check if the click is outside any open submenu of ContextMenuUI
    const subMenuElement = ContextMenuUI.getSubMenuElement(); // Assumes ContextMenuUI exposes this
    let clickedOutsideMainMenu = menuElement && !menuElement.contains(targetNode);
    let clickedOutsideSubMenu = subMenuElement && !subMenuElement.contains(targetNode);

    // If there's a submenu, hiding decision depends on clicks outside *both*
    // If no submenu, decision depends only on main menu.
    if (subMenuElement) {
      if (clickedOutsideMainMenu && clickedOutsideSubMenu) {
        ContextMenuUI.hide(); // This will also hide the submenu via its own logic
      }
    } else if (clickedOutsideMainMenu) {
      ContextMenuUI.hide();
    }
  };

  private handleAction = async (action: Action, selection: string): Promise<void> => {
    // Delegate UI work to ContextMenuUI.processAction to show results in-panel
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