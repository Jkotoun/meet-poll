import { Migration } from '@mikro-orm/migrations';

export class Migration20261015131046_users extends Migration {
  override name = 'Migration20261015131046_users';

  override up(): void | Promise<void> {
    this.addSql(
      `create type "identity_provider" as enum ('password', 'google');`,
    );
    this.addSql(
      `create table "users" ("id" uuid not null, "email" varchar(254) not null, "name" varchar(100) not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "identities" ("id" uuid not null, "user_id" uuid not null, "provider" "identity_provider" not null, "provider_subject" varchar(255) null, "password_hash" varchar(255) null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "identities" add constraint "identities_user_id_provider_unique" unique ("user_id", "provider");`,
    );
    this.addSql(
      `alter table "identities" add constraint "identities_provider_provider_subject_unique" unique ("provider", "provider_subject");`,
    );

    this.addSql(
      `alter table "users" add constraint "users_email_normalized_check" check ((email)::text = lower(TRIM(BOTH FROM email)));`,
    );

    this.addSql(
      `alter table "identities" add constraint "identities_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "identities" add constraint "identities_credentials_check" check ((provider = 'password' and password_hash is not null and provider_subject is null) or (provider = 'google' and provider_subject is not null and password_hash is null));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "identities" drop constraint "identities_user_id_foreign";`,
    );

    this.addSql(`drop table if exists "users" cascade;`);
    this.addSql(`drop table if exists "identities" cascade;`);

    this.addSql(`drop type "identity_provider";`);
  }
}
