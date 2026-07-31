-- ============================================================
-- Production admin features
-- Safe for Prisma shadow database and repeated execution
-- ============================================================

-- ------------------------------------------------------------
-- Add new NotificationType values only when the enum exists
-- ------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'NotificationType'
  ) THEN
    EXECUTE 'ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS ''ADMIN_MESSAGE''';
    EXECUTE 'ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS ''SYSTEM_ANNOUNCEMENT''';
  END IF;
END
$$;


-- ------------------------------------------------------------
-- Add production notification fields only when table exists
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('"Notification"') IS NOT NULL THEN
    ALTER TABLE "Notification"
      ADD COLUMN IF NOT EXISTS "title" TEXT,
      ADD COLUMN IF NOT EXISTS "message" TEXT,
      ADD COLUMN IF NOT EXISTS "link" TEXT,
      ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
  END IF;
END
$$;


-- Create notification index only when table and columns exist

DO $$
BEGIN
  IF (
    to_regclass('"Notification"') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Notification'
        AND column_name = 'userId'
    )
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Notification'
        AND column_name = 'isRead'
    )
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Notification'
        AND column_name = 'createdAt'
    )
  ) THEN
    CREATE INDEX IF NOT EXISTS
      "Notification_userId_isRead_createdAt_idx"
    ON "Notification" ("userId", "isRead", "createdAt");
  END IF;
END
$$;


-- ------------------------------------------------------------
-- Notification preferences
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
  "paymentUpdates" BOOLEAN NOT NULL DEFAULT true,
  "chatNotifications" BOOLEAN NOT NULL DEFAULT true,
  "promotional" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationPreference_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS
  "NotificationPreference_userId_key"
ON "NotificationPreference" ("userId");


DO $$
BEGIN
  IF (
    to_regclass('"User"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'NotificationPreference_userId_fkey'
    )
  ) THEN
    ALTER TABLE "NotificationPreference"
      ADD CONSTRAINT "NotificationPreference_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;


-- ------------------------------------------------------------
-- Admin notes
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AdminNote" (
  "id" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "subjectUserId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminNote_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS
  "AdminNote_entityType_entityId_createdAt_idx"
ON "AdminNote" ("entityType", "entityId", "createdAt");


DO $$
BEGIN
  IF (
    to_regclass('"User"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'AdminNote_authorUserId_fkey'
    )
  ) THEN
    ALTER TABLE "AdminNote"
      ADD CONSTRAINT "AdminNote_authorUserId_fkey"
      FOREIGN KEY ("authorUserId")
      REFERENCES "User" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;


DO $$
BEGIN
  IF (
    to_regclass('"User"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'AdminNote_subjectUserId_fkey'
    )
  ) THEN
    ALTER TABLE "AdminNote"
      ADD CONSTRAINT "AdminNote_subjectUserId_fkey"
      FOREIGN KEY ("subjectUserId")
      REFERENCES "User" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;


-- ------------------------------------------------------------
-- Activity timeline
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ActivityEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityEvent_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS
  "ActivityEvent_entityType_entityId_createdAt_idx"
ON "ActivityEvent" ("entityType", "entityId", "createdAt");

CREATE INDEX IF NOT EXISTS
  "ActivityEvent_userId_createdAt_idx"
ON "ActivityEvent" ("userId", "createdAt");


DO $$
BEGIN
  IF (
    to_regclass('"User"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'ActivityEvent_userId_fkey'
    )
  ) THEN
    ALTER TABLE "ActivityEvent"
      ADD CONSTRAINT "ActivityEvent_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;