import { Document, ObjectId } from 'mongoose';

// Base interface for all models
export interface BaseDocument extends Document {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
export type UserRole = 'admin' | 'agent' | 'user';

export interface IUser extends BaseDocument {
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

// Article related types
export type ArticleStatus = 'draft' | 'published';

export interface IArticle extends BaseDocument {
  title: string;
  body: string;
  tags: string[];
  status: ArticleStatus;
  createdBy: ObjectId;
}

// Ticket related types
export type TicketCategory = 'billing' | 'tech' | 'shipping' | 'other';
export type TicketStatus = 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed';
export type AuthorType = 'user' | 'agent' | 'system';

export interface IReply {
  _id: ObjectId;
  content: string;
  author: ObjectId;
  authorType: AuthorType;
  createdAt: Date;
}

export interface IAttachmentExtract {
  url: string;
  contentType: string;
  textSnippet: string;
  bytes: number;
}

export interface ITicket extends BaseDocument {
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdBy: ObjectId;
  assignee?: ObjectId;
  agentSuggestionId?: ObjectId;
  attachmentUrls?: string[];
  attachmentExtracts?: IAttachmentExtract[];
  replies: IReply[];
}

// Agent Suggestion related types
export interface IModelInfo {
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
}

export interface IAgentSuggestion extends BaseDocument {
  ticketId: ObjectId;
  predictedCategory: string;
  articleIds: ObjectId[];
  draftReply: string;
  confidence: number;
  autoClosed: boolean;
  modelInfo: IModelInfo;
}

// Audit Log related types
export type ActorType = 'system' | 'agent' | 'user';

export interface IAuditLog extends BaseDocument {
  ticketId: ObjectId;
  traceId: string;
  actor: ActorType;
  action: string;
  meta: Record<string, any>;
  timestamp: Date;
}

// Config related types
export interface IConfig extends BaseDocument {
  autoCloseEnabled: boolean;
  confidenceThreshold: number;
  slaHours: number;
  emailNotificationsEnabled: boolean;
  maxAttachmentSize: number;
  allowedAttachmentTypes: string[];
  updatedBy: ObjectId;
}

// Scored article for search results
export interface IScoredArticle {
  article: IArticle;
  score: number;
  relevanceReason?: string;
}

// Classification result from LLM
export interface IClassificationResult {
  predictedCategory: TicketCategory;
  confidence: number;
  reasoning?: string;
}

// Draft result from LLM
export interface IDraftResult {
  draftReply: string;
  citations: string[];
  confidence: number;
}

// RAG (Retrieval-Augmented Generation) related types
export interface IArticleEmbedding extends BaseDocument {
  articleId: ObjectId;
  content: string;
  embedding: number[];
  embeddingModel: string;
  chunks?: {
    text: string;
    embedding: number[];
    startIndex: number;
    endIndex: number;
  }[];
  lastUpdated: Date;
}

export interface IEmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface IRAGResult {
  articles: IScoredArticle[];
  query: string;
  searchMethod: 'vector' | 'hybrid' | 'keyword';
  totalMatches: number;
  executionTimeMs: number;
}

export interface IRAGContext {
  articles: IArticle[];
  relevanceScores: number[];
  searchQuery: string;
  totalTokens: number;
  maxContextLength: number;
}