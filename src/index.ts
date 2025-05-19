export { CogniSelect } from './cogni-select.sdk';
export type { CogniSelectConfig, Action } from './types';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
export const prebuiltModelIds = prebuiltAppConfig.model_list.map((model) => model.model_id); 