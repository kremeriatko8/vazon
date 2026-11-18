-- Google sign-in: accounts may have no password, and are linked by Google account id.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255);

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
