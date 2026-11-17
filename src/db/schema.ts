import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export type OrderLine = {
  itemId: string;
  name: string;
  unit: string | null;
  qty: number;
  /** Price of one unit, in paise. */
  price: number;
};

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Supabase Auth user id. One shop per owner. */
    ownerId: uuid("owner_id").notNull(),
    ownerEmail: text("owner_email"),
    /** Google email the shop will move to when that account next logs in. Lowercase. */
    pendingOwnerEmail: text("pending_owner_email"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    businessType: text("business_type").notNull(),
    description: text("description"),
    city: text("city").notNull(),
    citySlug: text("city_slug").notNull(),
    address: text("address"),
    /** 10-digit Indian mobile numbers. */
    phone: text("phone"),
    whatsapp: text("whatsapp").notNull(),
    logoUrl: text("logo_url"),
    ownerName: text("owner_name"),
    ownerPhotoUrl: text("owner_photo_url"),
    /** Photos of the shop itself (front, inside), so customers know they found the right place. At most MAX_SHOP_PHOTOS. */
    shopPhotoUrls: text("shop_photo_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    mapsUrl: text("maps_url"),
    /** Old layout choice. Still written so older app versions keep working; themes replaced it. */
    layout: text("layout").notNull(),
    /** Colour id within the theme ("accent"). Unknown ids fall back to the theme's first colour. */
    palette: text("palette").notNull(),
    /** Chosen theme id. Null means the theme made for the shop's business type. */
    theme: text("theme"),
    hideBranding: boolean("hide_branding").notNull().default(false),
    plan: text("plan").notNull().default("free"),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    /** The shop whose invite link this shop's owner joined through. */
    invitedBy: uuid("invited_by").references((): AnyPgColumn => shops.id, {
      onDelete: "set null",
    }),
    /** When the inviter got their free month for this shop. Set once, on this shop's first paid plan. */
    inviteRewardedAt: timestamp("invite_rewarded_at", { withTimezone: true }),
    isHidden: boolean("is_hidden").notNull().default(false),
    /** Secret in the review link the shopkeeper shares with customers. */
    reviewToken: text("review_token").notNull(),
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    itemCount: integer("item_count").notNull().default(0),
    photoCount: integer("photo_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shops_slug_key").on(t.slug),
    uniqueIndex("shops_owner_key").on(t.ownerId),
    index("shops_city_idx").on(t.citySlug),
    index("shops_type_idx").on(t.businessType),
    index("shops_invited_by_idx").on(t.invitedBy),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** Null for a category, set for a subcategory. Only two levels. */
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_shop_idx").on(t.shopId)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    /** Selling price in paise. */
    price: integer("price").notNull(),
    /** Optional MRP in paise, shown struck through. */
    mrp: integer("mrp"),
    unit: text("unit"),
    /** The main photo: always the first of imageUrls. Kept as its own column for lists and counts. */
    imageUrl: text("image_url"),
    /** All photos of the item, main photo first. At most MAX_ITEM_PHOTOS. */
    imageUrls: text("image_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    inStock: boolean("in_stock").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("items_shop_idx").on(t.shopId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    /** sha256 of the token kept in the reviewer's browser; needed to edit. */
    editTokenHash: text("edit_token_hash").notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    isReported: boolean("is_reported").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reviews_shop_phone_key").on(t.shopId, t.phone)],
);

export const orders = pgTable(
  "orders",
  {
    /** Short random code used in the order link. */
    id: text("id").primaryKey(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerName: text("customer_name"),
    note: text("note"),
    lines: jsonb("lines").$type<OrderLine[]>().notNull(),
    /** Total in paise. */
    total: integer("total").notNull(),
    /** Hashed network address of the sender; only used to limit spam orders. */
    clientHash: text("client_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_shop_idx").on(t.shopId, t.createdAt)],
);

export type Shop = typeof shops.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
