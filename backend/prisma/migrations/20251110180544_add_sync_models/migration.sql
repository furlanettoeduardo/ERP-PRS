-- CreateEnum
CREATE TYPE "SyncJobType" AS ENUM ('PRODUCT_IMPORT', 'PRODUCT_EXPORT', 'STOCK_SYNC', 'PRICE_SYNC', 'CUSTOMER_SYNC', 'ORDER_IMPORT', 'RECONCILIATION', 'FULL_SYNC');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SKIP', 'ERROR');

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attributes" JSONB,
    "price" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_products" (
    "id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "marketplace_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "sku" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "mapped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),
    "extra_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_mappings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "external_category_id" TEXT,
    "mapping_rules" JSONB,
    "attribute_mapping" JSONB,
    "price_adjustment" DECIMAL(10,2),
    "price_adjustment_type" TEXT DEFAULT 'fixed',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_mappings" (
    "id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "external_category_id" TEXT NOT NULL,
    "external_category_name" TEXT,
    "local_category_id" TEXT,
    "local_category_name" TEXT,
    "attributes_schema" JSONB,
    "mapping" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "type" "SyncJobType" NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_items" INTEGER,
    "processed_items" INTEGER,
    "failed_items" INTEGER,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "meta" JSONB,
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "external_id" TEXT,
    "local_id" TEXT,
    "sku" TEXT,
    "action" "SyncAction" NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_mappings" (
    "id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "external_customer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "name" TEXT,
    "extra_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marketplace" "Marketplace",
    "formula" JSONB NOT NULL,
    "conditions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_stock" (
    "id" TEXT NOT NULL,
    "product_variant_id" TEXT,
    "warehouse_id" TEXT NOT NULL,
    "marketplace" "Marketplace",
    "available_qty" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "external_id" TEXT,
    "field" TEXT NOT NULL,
    "local_value" TEXT,
    "remote_value" TEXT,
    "resolution" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_configs" (
    "id" TEXT NOT NULL,
    "marketplace" "Marketplace" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "stock_sync_interval" INTEGER NOT NULL DEFAULT 120,
    "price_sync_interval" INTEGER NOT NULL DEFAULT 1800,
    "product_sync_interval" INTEGER NOT NULL DEFAULT 43200,
    "customer_sync_interval" INTEGER NOT NULL DEFAULT 1800,
    "auto_sync" BOOLEAN NOT NULL DEFAULT false,
    "source_of_truth" TEXT NOT NULL DEFAULT 'erp',
    "conflict_resolution" TEXT NOT NULL DEFAULT 'manual',
    "batch_size" INTEGER NOT NULL DEFAULT 50,
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "marketplace_products_product_id_idx" ON "marketplace_products"("product_id");

-- CreateIndex
CREATE INDEX "marketplace_products_variant_id_idx" ON "marketplace_products"("variant_id");

-- CreateIndex
CREATE INDEX "marketplace_products_sku_idx" ON "marketplace_products"("sku");

-- CreateIndex
CREATE INDEX "marketplace_products_marketplace_sku_idx" ON "marketplace_products"("marketplace", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_products_marketplace_marketplace_item_id_key" ON "marketplace_products"("marketplace", "marketplace_item_id");

-- CreateIndex
CREATE INDEX "product_mappings_marketplace_idx" ON "product_mappings"("marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "product_mappings_product_id_marketplace_key" ON "product_mappings"("product_id", "marketplace");

-- CreateIndex
CREATE INDEX "category_mappings_marketplace_idx" ON "category_mappings"("marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "category_mappings_marketplace_external_category_id_key" ON "category_mappings"("marketplace", "external_category_id");

-- CreateIndex
CREATE INDEX "sync_jobs_marketplace_idx" ON "sync_jobs"("marketplace");

-- CreateIndex
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_type_idx" ON "sync_jobs"("type");

-- CreateIndex
CREATE INDEX "sync_jobs_created_at_idx" ON "sync_jobs"("created_at");

-- CreateIndex
CREATE INDEX "sync_logs_job_id_idx" ON "sync_logs"("job_id");

-- CreateIndex
CREATE INDEX "sync_logs_marketplace_idx" ON "sync_logs"("marketplace");

-- CreateIndex
CREATE INDEX "sync_logs_result_idx" ON "sync_logs"("result");

-- CreateIndex
CREATE INDEX "sync_logs_created_at_idx" ON "sync_logs"("created_at");

-- CreateIndex
CREATE INDEX "client_mappings_email_idx" ON "client_mappings"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_mappings_marketplace_external_customer_id_key" ON "client_mappings"("marketplace", "external_customer_id");

-- CreateIndex
CREATE INDEX "price_rules_active_idx" ON "price_rules"("active");

-- CreateIndex
CREATE INDEX "price_rules_marketplace_idx" ON "price_rules"("marketplace");

-- CreateIndex
CREATE INDEX "channel_stock_warehouse_id_idx" ON "channel_stock"("warehouse_id");

-- CreateIndex
CREATE INDEX "channel_stock_marketplace_idx" ON "channel_stock"("marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "channel_stock_product_variant_id_warehouse_id_marketplace_key" ON "channel_stock"("product_variant_id", "warehouse_id", "marketplace");

-- CreateIndex
CREATE INDEX "sync_conflicts_marketplace_idx" ON "sync_conflicts"("marketplace");

-- CreateIndex
CREATE INDEX "sync_conflicts_resolved_idx" ON "sync_conflicts"("resolved");

-- CreateIndex
CREATE INDEX "sync_conflicts_entity_type_idx" ON "sync_conflicts"("entity_type");

-- CreateIndex
CREATE INDEX "sync_conflicts_created_at_idx" ON "sync_conflicts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sync_configs_marketplace_key" ON "sync_configs"("marketplace");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mappings" ADD CONSTRAINT "product_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "sync_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_stock" ADD CONSTRAINT "channel_stock_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_stock" ADD CONSTRAINT "channel_stock_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
