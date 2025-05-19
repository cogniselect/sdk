import type { CogniSelectConfig, Action } from './types';
import { CreateMLCEngine, hasModelInCache, deleteModelAllInfoInCache, MLCEngineConfig, modelLibURLPrefix, modelVersion, AppConfig, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { ContextMenuProcessor } from './context-menu-processor'
import { IndicatorUI } from './ui/indicator';
import { StatusMenuUI } from './ui/status-menu';
import { ActionEditorUI } from './ui/action-editor';

export class CogniSelect {
  private config: CogniSelectConfig;
  private actions: Action[] = [];
  private engine: any = null;
  private contextMenuProcessor: ContextMenuProcessor | null = null;
  private indicatorWrapperEl: HTMLDivElement | null = null;
  private statusMenuEl: HTMLDivElement | null = null;
  private editorOverlayEl: HTMLDivElement | null = null;
  private modelList: typeof prebuiltAppConfig.model_list = prebuiltAppConfig.model_list;

  /**
   * Creates an instance of CogniSelect.
   * @param config Configuration for CogniSelect.
   */
  constructor(config: CogniSelectConfig) {
    this.config = config;
    this.modelList = this.config.modelList ?? prebuiltAppConfig.model_list;
    const storedActions = localStorage.getItem('cogniselect_actions');
    this.actions = storedActions ? JSON.parse(storedActions) : config.actions;
  }

  /**
   * Attaches the CogniSelect status indicator to the specified container.
   * @param containerSelector CSS selector for the container element.
   * @returns The CogniSelect instance for chaining.
   */
  public attachCogniSelectStatus(containerSelector: string): CogniSelect {
    const container = document.querySelector(containerSelector);

    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    this.indicatorWrapperEl = IndicatorUI.create(container as HTMLElement, async () => {
      await this.toggleStatusMenu();
    });

    return this;
  }

  /**
   * Handles downloading the model on indicator click, showing confirmation and progress.
   */
  private async downloadAndActivateModel(totalMB: number, onProgress?: (loadedMB: number, totalMB: number) => void): Promise<void> {
    const appConfig: AppConfig = {
      useIndexedDBCache: this.config.cacheStrategy === 'persistent',
      model_list: this.modelList
    };

    // Build engine with progress callback
    const engineConfig: MLCEngineConfig = {
      appConfig,
      initProgressCallback: (report: any) => {
        const loadedMB = report.progress * totalMB;
        if (onProgress) onProgress(loadedMB, totalMB);
      }
    };
    
    this.engine = await CreateMLCEngine(this.config.model, engineConfig);
    // After load, mark initialized and attach context menu
    this.contextMenuProcessor = new ContextMenuProcessor(this.engine, this.actions);
    this.contextMenuProcessor.attach();
  }

  /**
   * Gets the approximate size of a model. 
   * @param modelId The ID of the model.
   * @returns A string representing the human-readable model size (e.g., "800 MB").
   * @remarks This is currently a stub and returns a fixed size. Future implementations might fetch real metadata.
   */
  private async getModelSize(modelId: string): Promise<string> {
    console.log('getModelSize', modelId);
    console.log('modelList', this.modelList);
    const model = this.modelList.find(m => m.model_id === modelId);

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return model.vram_required_MB?.toString() || '800';
  }


  // Toggles the visibility of the status dropdown menu
  private async toggleStatusMenu(): Promise<void> {
    if (this.statusMenuEl) {
      StatusMenuUI.hide();
      this.statusMenuEl = null;
      return;
    }
    const appConfig: AppConfig = {
      useIndexedDBCache: this.config.cacheStrategy === 'persistent',
      model_list: this.modelList
    };
    const cacheExists = this.config.cacheStrategy === 'persistent'
      ? await hasModelInCache(this.config.model, appConfig)
      : false;
    this.statusMenuEl = StatusMenuUI.show(
      this.indicatorWrapperEl!,
      !!this.contextMenuProcessor,
      this.getModelSize.bind(this),
      this.downloadAndActivateModel.bind(this),
      this.actions,
      (newActions: Action[]) => {
        this.actions = newActions;
        localStorage.setItem('cogniselect_actions', JSON.stringify(this.actions));
        if (this.contextMenuProcessor) {
          this.contextMenuProcessor.updateActions(this.actions);
        }
      },
      this.config.model
    , this.config.cacheStrategy
    , this.modelList
    , cacheExists
    );
  }

  // Removes the status dropdown menu
  private hideStatusMenu(): void {
    // Status menu hide delegated to StatusMenuUI
  }

  // Opens a modal to edit actions list
  private showActionEditor(): void {
    // Action editor show delegated to ActionEditorUI
  }

  // Closes the action editor modal
  private hideActionEditor(): void {
    // Action editor hide delegated to ActionEditorUI
  }
} 