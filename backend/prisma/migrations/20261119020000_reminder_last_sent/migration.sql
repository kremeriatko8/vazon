-- Day of the last reminder email, so each user gets at most one per day.
ALTER TABLE "user_settings" ADD COLUMN "last_reminder_sent_on" VARCHAR(10);
