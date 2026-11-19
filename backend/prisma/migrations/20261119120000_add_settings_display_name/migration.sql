-- How the app greets the user; null means "use the part of the email before @".
ALTER TABLE "user_settings" ADD COLUMN "display_name" VARCHAR(50);
