import { Migration } from '@mikro-orm/migrations';

export class Migration20261016105217_events extends Migration {
  override name = 'Migration20261016105217_events';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "events" ("id" uuid not null, "slug" varchar(12) not null, "title" varchar(200) not null, "timezone" varchar(64) not null, "organizer_id" uuid not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "events" add constraint "events_slug_unique" unique ("slug");`,
    );
    this.addSql(
      `create index "events_organizer_id_index" on "events" ("organizer_id");`,
    );

    this.addSql(
      `create table "time_slots" ("id" uuid not null, "event_id" uuid not null, "starts_at" timestamptz not null, "ends_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "time_slots_event_id_index" on "time_slots" ("event_id");`,
    );

    this.addSql(
      `alter table "events" add constraint "events_organizer_id_foreign" foreign key ("organizer_id") references "users" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "time_slots" add constraint "time_slots_event_id_foreign" foreign key ("event_id") references "events" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "time_slots" add constraint "time_slots_ends_after_starts_check" check (ends_at > starts_at);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "time_slots" drop constraint "time_slots_event_id_foreign";`,
    );

    this.addSql(`drop table if exists "events" cascade;`);
    this.addSql(`drop table if exists "time_slots" cascade;`);
  }
}
