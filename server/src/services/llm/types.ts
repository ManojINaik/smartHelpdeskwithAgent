import { IArticle, IClassificationResult, IDraftResult } from '../../types/models.js';

export interface LLMProvider {
  isStubMode(): boolean;
  classify(text: string): Promise<IClassificationResult>;
  draft(text: string, articles: IArticle[]): Promise<IDraftResult>;
}


