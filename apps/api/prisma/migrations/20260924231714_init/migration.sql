-- CreateEnum
CREATE TYPE "IndicatorSource" AS ENUM ('BCB', 'FRED');

-- CreateEnum
CREATE TYPE "IndicatorFrequency" AS ENUM ('DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "VariationStrategy" AS ENUM ('PREVIOUS_OBSERVATIONS', 'PREVIOUS_CALENDAR_MONTH', 'PREVIOUS_CALENDAR_DAYS');

-- CreateTable
CREATE TABLE "indicators" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "IndicatorSource" NOT NULL,
    "external_code" TEXT NOT NULL,
    "frequency" "IndicatorFrequency" NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "limitation_text" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "variation_strategy" "VariationStrategy" NOT NULL,
    "variation_periods" INTEGER NOT NULL,
    "history_months" INTEGER NOT NULL,
    "ttl_minutes" INTEGER NOT NULL,
    "last_synced_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "observations" (
    "indicator_slug" TEXT NOT NULL,
    "reference_date" DATE NOT NULL,
    "value" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("indicator_slug","reference_date")
);

-- CreateTable
CREATE TABLE "favorites" (
    "visitor_id" UUID NOT NULL,
    "indicator_slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("visitor_id","indicator_slug")
);

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_indicator_slug_fkey" FOREIGN KEY ("indicator_slug") REFERENCES "indicators"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_indicator_slug_fkey" FOREIGN KEY ("indicator_slug") REFERENCES "indicators"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
