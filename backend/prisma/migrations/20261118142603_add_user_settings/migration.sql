-- CreateEnum
CREATE TYPE "Language" AS ENUM ('uk', 'en');

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" UUID NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'en',
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder_time" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "day_before_alert" BOOLEAN NOT NULL DEFAULT false,
    "email_digest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
