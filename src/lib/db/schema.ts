import { pgTable, pgEnum, serial, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
export const userSystemEnum = pgEnum('user_system_enum', ['system', 'user']);

export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    pdfName: text('pdf_name').notNull(),
    pdfUrl: text('pdf_url').notNull(),
    userId: varchar('user_id', { length: 256 }).notNull(),
    fileKey: text('file_key').notNull(),
});

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').references(() => chats.id).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    role: userSystemEnum('role').notNull(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 256 }).notNull(), 
    stripeCustomerId: varchar('stripe_customer_id', { length: 256 }).notNull(), 
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 256 }).unique(),
    stripePriceId: varchar('stripe_price_id', { length: 256 }),
    stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
});