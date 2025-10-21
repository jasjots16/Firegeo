import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
export * from './schema.files';

// Enums
export const roleEnum = pgEnum('role', ['user', 'assistant']);
export const themeEnum = pgEnum('theme', ['light', 'dark']);

// User Profile table - extends Better Auth user with additional fields
export const userProfile = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Conversations table - stores chat threads
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Messages table - stores individual chat messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  role: roleEnum('role').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Message Feedback table - for rating AI responses
export const messageFeedback = pgTable('message_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  rating: integer('rating'), // 1-5
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Settings table - app-specific preferences
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  theme: themeEnum('theme').default('light'),
  emailNotifications: boolean('email_notifications').default(true),
  marketingEmails: boolean('marketing_emails').default(false),
  defaultModel: text('default_model').default('gpt-3.5-turbo'),
  metadata: jsonb('metadata'), // For any additional settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Define relations without user table reference
export const userProfileRelations = relations(userProfile, ({ many }) => ({
  conversations: many(conversations),
  brandAnalyses: many(brandAnalyses),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  userProfile: one(userProfile, {
    fields: [conversations.userId],
    references: [userProfile.userId],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  feedback: many(messageFeedback),
}));

export const messageFeedbackRelations = relations(messageFeedback, ({ one }) => ({
  message: one(messages, {
    fields: [messageFeedback.messageId],
    references: [messages.id],
  }),
}));

// Brand Monitor Analyses
export const brandAnalyses = pgTable('brand_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  // normalized url used for job selection
  url: text('url').notNull(),
  // shared job id across features
  jobId: uuid('job_id').notNull().defaultRandom(),
  companyName: text('company_name'),
  industry: text('industry'),
  analysisData: jsonb('analysis_data'), // Stores the full analysis results
  competitors: jsonb('competitors'), // Stores competitor data (legacy; normalized in analysis_competitors)
  prompts: jsonb('prompts'), // Stores the prompts used
  creditsUsed: integer('credits_used').default(10),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// AEO Reports (merged output of AEO auditor + Schema auditor)
export const aeoReports = pgTable('aeo_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  customerName: text('customer_name').notNull(),
  // normalized url used for job selection
  url: text('url').notNull(),
  // shared job id across features
  jobId: uuid('job_id').notNull().defaultRandom(),
  html: text('html').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// File Generation Jobs (existing table name provided)
export const fileGenerationJobs = pgTable('file_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  // normalized url used for job selection
  url: text('url').notNull(),
  // shared job id across features
  jobId: uuid('job_id').notNull().defaultRandom(),
  // preserve existing columns to avoid data loss
  userEmail: text('user_email'),
  brand: text('brand'),
  category: text('category'),
  competitors: jsonb('competitors'),
  // prompts and files metadata
  prompts: text('prompts'),
  filesMeta: jsonb('files_meta'),
  // job execution outputs
  result: jsonb('result'),
  error: text('error'),
  nonce: text('nonce'),
  webhookAttemptedAt: timestamp('webhook_attempted_at'),
  webhookResponseCode: text('webhook_response_code'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Competitors (normalized)
export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  url: text('competitor_url'),
  favicon: text('favicon'),
  ogImage: text('og_image'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Analysis Competitors (snapshot per analysis + job)
export const analysisCompetitors = pgTable('analysis_competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  analysisId: uuid('analysis_id').notNull().references(() => brandAnalyses.id, { onDelete: 'cascade' }),
  competitorId: uuid('competitor_id').notNull().references(() => competitors.id, { onDelete: 'cascade' }),
  isOwn: boolean('is_own').default(false),
  visibilityScore: integer('visibility_score'),
  mentions: integer('mentions'),
  averagePosition: integer('average_position'),
  sentiment: text('sentiment'),
  sentimentScore: integer('sentiment_score'),
  shareOfVoice: integer('share_of_voice'),
  weeklyChange: integer('weekly_change'),
  providerComparison: jsonb('provider_comparison'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const brandAnalysesRelations = relations(brandAnalyses, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [brandAnalyses.userId],
    references: [userProfile.userId],
  }),
}));

export const aeoReportsRelations = relations(aeoReports, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [aeoReports.userId],
    references: [userProfile.userId],
  }),
}));

export const fileGenerationJobsRelations = relations(fileGenerationJobs, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [fileGenerationJobs.userId],
    references: [userProfile.userId],
  }),
}));

// Type exports for use in application
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageFeedback = typeof messageFeedback.$inferSelect;
export type NewMessageFeedback = typeof messageFeedback.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type BrandAnalysis = typeof brandAnalyses.$inferSelect;
export type NewBrandAnalysis = typeof brandAnalyses.$inferInsert;
export type AeoReport = typeof aeoReports.$inferSelect;
export type NewAeoReport = typeof aeoReports.$inferInsert;
export type FileGenerationJob = typeof fileGenerationJobs.$inferSelect;
export type NewFileGenerationJob = typeof fileGenerationJobs.$inferInsert;
export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;
export type AnalysisCompetitor = typeof analysisCompetitors.$inferSelect;
export type NewAnalysisCompetitor = typeof analysisCompetitors.$inferInsert;