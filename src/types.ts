import { prebuiltAppConfig } from "@mlc-ai/web-llm";

const modelList = prebuiltAppConfig.model_list;

export interface CogniSelectConfig {
  model: string;
  cacheStrategy: 'persistent' | 'memory';
  actions: Action[];
  modelList?: typeof modelList;
}

export interface Action {
  category: string;
  description: string;
  prompt: string;
} 