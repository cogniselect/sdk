import type { Action } from '../types';
import { createStyledElement } from './dom-utils';

export class ContextMenuUI {
  private static menuElement: HTMLElement | null = null;
  private static resultPanel: HTMLElement | null = null;
  private static messageHistory: {role: string, content: string}[] = [];
  private static followupCount: number = 0;
  private static currentAction: Action | null = null;
  private static currentSelection: string = '';
  private static currentEngine: any = null;

  public static show(
    x: number,
    y: number,
    selection: string,
    actions: Action[],
    actionCallback: (action: Action, selection: string) => void
  ): void {
    if (ContextMenuUI.menuElement) {
      ContextMenuUI.hide();
    }

    // Create the menu wrapper for positioning
    ContextMenuUI.menuElement = createStyledElement('div', {
      position: 'fixed',
      zIndex: '10000',
      fontFamily: 'Arial, sans-serif',
      minWidth: '280px',
    });

    // Create container with border and scrolling
    const container = createStyledElement('div', {
      background: '#fff',
      border: '1px solid #000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '8px',
      maxHeight: `${window.innerHeight - 40}px`,
      overflowY: 'auto',
      boxSizing: 'border-box',
    });

    // Add tip for context menu usage
    const tipEl = createStyledElement('div', {
      fontSize: '12px',
      color: '#555',
      fontStyle: 'italic',
      fontWeight: 'bold',
      marginBottom: '8px',
    }, 'Tip: Highlight text and right-click to reveal CogniSelect menu');
    container.appendChild(tipEl);

    const title = createStyledElement('div', {
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      marginBottom: '8px',
    }, 'COGNISELECT ANALYSIS');
    container.appendChild(title);

    const groups: Record<string, Action[]> = {};

    for (const action of actions) {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }

      groups[action.category].push(action);
    }

    for (const [category, categoryActions] of Object.entries(groups)) {
      const header = createStyledElement('div', {
        fontSize: '14px',
        fontWeight: '700',
        margin: '8px 0 4px',
      }, category.charAt(0).toUpperCase() + category.slice(1));
      container.appendChild(header);

      for (const action of categoryActions) {
        const button = createStyledElement('button', {
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
        }, action.description);

        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = '#f3f4f6';
        });
        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = 'transparent';
        });
        button.addEventListener('click', () => {
          actionCallback(action, selection);
          button.blur();
        });

        container.appendChild(button);
      }
    }

    // Append container to wrapper and wrapper to body
    ContextMenuUI.menuElement.appendChild(container);
    document.body.appendChild(ContextMenuUI.menuElement);

    // Position wrapper
    const rect = ContextMenuUI.menuElement.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    let finalX = x;
    let finalY = y;
    if (x + rect.width > viewW) finalX = Math.max(0, viewW - rect.width);
    if (y + rect.height > viewH) finalY = Math.max(0, viewH - rect.height);
    ContextMenuUI.menuElement.style.top = `${finalY}px`;
    ContextMenuUI.menuElement.style.left = `${finalX}px`;
  }

  public static hide(): void {
    if (!ContextMenuUI.menuElement) {
      return;
    }

    document.body.removeChild(ContextMenuUI.menuElement);
    ContextMenuUI.menuElement = null;
    ContextMenuUI.resultPanel = null;
    // Reset conversation state
    ContextMenuUI.messageHistory = [];
    ContextMenuUI.followupCount = 0;
    ContextMenuUI.currentAction = null;
    ContextMenuUI.currentSelection = '';
    ContextMenuUI.currentEngine = null;
  }

  public static getElement(): HTMLElement | null {
    return ContextMenuUI.menuElement;
  }

  /**
   * Processes an action: streams response and renders panels inside the existing context menu.
   */
  public static async processAction(
    engine: any,
    actions: Action[],
    action: Action,
    selection: string
  ): Promise<void> {
    const menuEl = ContextMenuUI.getElement();
    if (!menuEl) return;
    // The main container (first child) holds the menu items and will be locked to its current width
    const container = menuEl.firstElementChild as HTMLElement;
    if (!container) return;
    // Lock container width to prevent expansion
    const initialRect = container.getBoundingClientRect();
    container.style.width = `${initialRect.width}px`;
    // Initialize conversation state for this action
    ContextMenuUI.currentEngine = engine;
    ContextMenuUI.currentAction = action;
    ContextMenuUI.currentSelection = selection;
    // Start message history with initial user prompt
    ContextMenuUI.messageHistory = [{ role: 'user', content: action.prompt.replace('{text}', selection) }];

    // Remove any existing result section
    const old = container.querySelector('.cogniselect-result-section');
    if (old) old.remove();

    // Create a new result section inside the container
    const section = createStyledElement('div', {
      borderTop: '1px solid #000',
      marginTop: '8px',
      paddingTop: '8px',
      width: '100%',
      fontSize: '14px'
    });
    section.classList.add('cogniselect-result-section');

    // Processing line
    const processing = createStyledElement('div', {
      fontStyle: 'italic',
      color: '#555',
      padding: '4px 0',
      width: '100%'
    }, `${action.description}...`);
    section.appendChild(processing);

    // Divider
    const hr1 = document.createElement('hr');
    hr1.style.margin = '6px 0';
    section.appendChild(hr1);

    // Result container
    const resultContainer = createStyledElement('div', {
      maxHeight: '160px',
      overflowY: 'auto',
      padding: '4px 0',
      width: '100%',
      fontSize: '14px',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      boxSizing: 'border-box',
    });
    section.appendChild(resultContainer);

    // Divider
    const hr2 = document.createElement('hr');
    hr2.style.margin = '6px 0';
    section.appendChild(hr2);

    // Follow-up input + examples
    const inputWrapper = createStyledElement('div', { display: 'flex', gap: '6px', alignItems: 'center' });
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = action.description + '...';
    Object.assign(input.style, {
      flex: '1',
      padding: '4px 8px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontStyle: 'normal',
    });
    const askBtn = createStyledElement('button', {
      padding: '4px 12px',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    }, 'Ask');
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(askBtn);
    section.appendChild(inputWrapper);

    const ex = createStyledElement('div', {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px',
    }, 'Examples: "Which issue is most critical?", "What are the positive points mentioned?"');
    section.appendChild(ex);

    // Append the result section into the menu container
    container.appendChild(section);
    // Scroll container so newly appended section (including the input) is visible
    container.scrollTop = container.scrollHeight;
    
    // Initial stream into resultContainer
    try {
      const chunks = await engine.chat.completions.create({ messages: ContextMenuUI.messageHistory, temperature: 0.7, stream: true });
      let full = '';
      for await (const chunk of chunks) {
        full += chunk.choices[0]?.delta?.content || '';
        // render bold markdown
        const html = full.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        resultContainer.innerHTML = html;
        resultContainer.scrollTop = resultContainer.scrollHeight;
      }
      // Add assistant's initial response to history
      ContextMenuUI.messageHistory.push({ role: 'assistant', content: full });
    } catch (e) {
      resultContainer.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Handle follow-up questions inline
    let followups = 0;
    const maxFollowups = 5;
    const ask = async () => {
      const q = input.value.trim(); if (!q || followups >= maxFollowups) return;
      input.value = '';
      followups++;
      // Create follow-up processing line
      const fProc = createStyledElement('div', {
        fontStyle: 'italic',
        color: '#555',
        padding: '4px 0',
        fontSize: '14px'
      }, `Processing follow-up question...`);
      section.insertBefore(fProc, hr2);
      container.scrollTop = container.scrollHeight;
      // Divider
      const fHr = document.createElement('hr'); fHr.style.margin = '6px 0'; section.insertBefore(fHr, hr2);
      // New result block
      const fResult = createStyledElement('div', {
        maxHeight: '160px',
        overflowY: 'auto',
        padding: '4px 0',
        width: '100%',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
      });
      section.insertBefore(fResult, hr2);
      container.scrollTop = container.scrollHeight;
      // Send follow-up
      try {
        // Add follow-up question to history and send full conversation
        ContextMenuUI.messageHistory.push({ role: 'user', content: q });
        const msgs = [...ContextMenuUI.messageHistory];
        const chunks2 = await engine.chat.completions.create({ messages: msgs, temperature: 0.7, stream: true });
        let ans = '';
        for await (const ch of chunks2) {
          ans += ch.choices[0]?.delta?.content || '';
          const html2 = ans.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          fResult.innerHTML = html2;
          fResult.scrollTop = fResult.scrollHeight;
          container.scrollTop = container.scrollHeight;
        }
        // Add assistant's follow-up response to history
        ContextMenuUI.messageHistory.push({ role: 'assistant', content: ans });
      } catch (err) {
        fResult.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
      // disable if limit reached
      if (followups >= maxFollowups) {
        input.disabled = true; askBtn.disabled = true; input.placeholder = 'Follow-up limit reached';
      }
      // Bring the input back into view
      input.focus();
      input.scrollIntoView({ block: 'nearest' });
    };
    askBtn.addEventListener('click', ask);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });
  }

  private static formatResponse(container: HTMLElement, responseText: string, actionDescription: string): void {
    // Clean the container
    container.innerHTML = '';
    
    // First add the action description as a "header"
    const actionHeader = createStyledElement('div', {
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderBottom: '1px solid #e0e0e0',
      fontWeight: 'bold',
    }, actionDescription);
    container.appendChild(actionHeader);
    
    // Add a processing status
    const processingStatus = createStyledElement('div', {
      padding: '10px 15px',
      fontStyle: 'italic',
      borderBottom: '1px solid #e0e0e0',
    }, '');
    container.appendChild(processingStatus);
    
    // Format the response - try to detect sections/paragraphs
    const responseContainer = createStyledElement('div', {
      padding: '15px',
      whiteSpace: 'pre-wrap',
    });
    
    // Format the response text - replace newlines with proper spacing
    let formattedText = responseText.replace(/\n\n+/g, '\n\n');
    responseContainer.textContent = formattedText;
    
    container.appendChild(responseContainer);
  }

  private static addFollowupInput(): void {
    if (!ContextMenuUI.resultPanel) return;
    
    // Don't show follow-up if we've reached the limit
    if (ContextMenuUI.followupCount >= 5) {
      // Just show the close button
      ContextMenuUI.addCloseButton();
      return;
    }
    
    // Create follow-up container
    const followupContainer = createStyledElement('div', {
      padding: '15px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#f9f9f9',
    });
    
    // Create input and button container
    const inputContainer = createStyledElement('div', {
      display: 'flex',
      gap: '10px',
      width: '100%',
    });
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask a follow-up question...';
    input.style.flex = '1';
    input.style.padding = '10px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '5px';
    input.style.fontSize = '14px';
    inputContainer.appendChild(input);
    
    // Create Ask button
    const askButton = createStyledElement('button', {
      padding: '10px 15px',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
    }, 'Ask');
    inputContainer.appendChild(askButton);
    
    followupContainer.appendChild(inputContainer);
    
    // Add examples
    const examplesContainer = createStyledElement('div', {
      marginTop: '10px',
      fontSize: '12px',
      color: '#666',
    }, 'Examples: "Tell me more about this", "Why is this important?", "How does this work?"');
    
    followupContainer.appendChild(examplesContainer);
    
    // Add close button container
    const closeContainer = createStyledElement('div', {
      marginTop: '15px',
      display: 'flex',
      justifyContent: 'center',
    });
    
    // Create close button
    const closeButton = createStyledElement('button', {
      padding: '8px 15px',
      backgroundColor: '#f0f0f0',
      color: '#000',
      border: '1px solid #ccc',
      borderRadius: '5px',
      cursor: 'pointer',
    }, 'Close');
    
    closeContainer.appendChild(closeButton);
    followupContainer.appendChild(closeContainer);
    
    // Add event listeners
    askButton.addEventListener('click', async () => {
      const question = input.value.trim();
      if (!question) return;
      
      ContextMenuUI.handleFollowupQuestion(question);
    });
    
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const question = input.value.trim();
        if (!question) return;
        
        ContextMenuUI.handleFollowupQuestion(question);
      }
    });
    
    closeButton.addEventListener('click', () => {
      ContextMenuUI.hide();
    });
    
    // Add to panel
    ContextMenuUI.resultPanel.appendChild(followupContainer);
    
    // Focus input
    input.focus();
  }
  
  private static async handleFollowupQuestion(question: string): Promise<void> {
    if (!ContextMenuUI.resultPanel || !ContextMenuUI.currentEngine) return;
    
    // Increment follow-up count
    ContextMenuUI.followupCount++;
    
    // Get content container
    const contentContainer = ContextMenuUI.resultPanel.querySelector('div:nth-child(2)') as HTMLElement;
    if (!contentContainer) return;
    
    // Clear the container
    contentContainer.innerHTML = '';
    
    // Add the question section
    const questionSection = createStyledElement('div', {
      padding: '15px',
      backgroundColor: '#f0f7ff',
      borderBottom: '1px solid #e0e0e0',
      fontWeight: 'normal',
    }, question);
    contentContainer.appendChild(questionSection);
    
    // Add loading indicator
    const loadingSection = createStyledElement('div', {
      padding: '15px',
      fontStyle: 'italic',
      color: '#666',
    }, 'Processing your question...');
    contentContainer.appendChild(loadingSection);
    
    // Add to message history
    ContextMenuUI.messageHistory.push({ role: 'user', content: question });
    
    try {
      // Prepare messages for chat completion
      const messages = ContextMenuUI.messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Use the chat API with streaming
      const chunks = await ContextMenuUI.currentEngine.chat.completions.create({
        messages: messages,
        temperature: 0.7,
        stream: true
      });
      
      // Variables to collect the response
      let responseText = '';
      
      // Process streaming response chunks
      for await (const chunk of chunks) {
        if (!ContextMenuUI.resultPanel) {
          // Panel was closed during streaming
          break;
        }
        
        const content = chunk.choices[0]?.delta?.content || '';
        responseText += content;
        
        // Update loading section with partial content
        loadingSection.textContent = 'Processing...';
      }
      
      // Store assistant's message
      ContextMenuUI.messageHistory.push({ role: 'assistant', content: responseText });
      
      // Remove loading indicator
      contentContainer.removeChild(loadingSection);
      
      // Add response section
      const responseSection = createStyledElement('div', {
        padding: '15px',
        whiteSpace: 'pre-wrap',
      }, responseText);
      contentContainer.appendChild(responseSection);
      
      // Update follow-up input (remove old one and add new)
      const oldFollowupContainer = ContextMenuUI.resultPanel.lastChild;
      if (oldFollowupContainer) {
        ContextMenuUI.resultPanel.removeChild(oldFollowupContainer);
      }
      
      // Add new follow-up input
      ContextMenuUI.addFollowupInput();
      
    } catch (error) {
      // Show error message
      contentContainer.innerHTML = '';
      const errorSection = createStyledElement('div', {
        padding: '15px',
        color: 'red',
      }, `Error: ${error instanceof Error ? error.message : String(error)}`);
      contentContainer.appendChild(errorSection);
      
      // Add close button
      ContextMenuUI.addCloseButton();
    }
  }

  private static addCloseButton(): void {
    if (!ContextMenuUI.resultPanel) return;
    
    // Create close container
    const closeContainer = createStyledElement('div', {
      padding: '15px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'center',
    });
    
    // Create close button
    const closeButton = createStyledElement('button', {
      padding: '10px 15px',
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
    }, 'Close');
    
    closeButton.addEventListener('click', () => {
      ContextMenuUI.hide();
    });
    
    closeContainer.appendChild(closeButton);
    
    // Add to panel
    ContextMenuUI.resultPanel.appendChild(closeContainer);
  }
} 