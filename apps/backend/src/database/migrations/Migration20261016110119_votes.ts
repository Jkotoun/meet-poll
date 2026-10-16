import { Migration } from '@mikro-orm/migrations';

export class Migration20261016110119_votes extends Migration {
  override name = 'Migration20261016110119_votes';

  override up(): void | Promise<void> {
    this.addSql(
      `create type "vote_choice" as enum ('yes', 'if_need_be', 'no');`,
    );
    this.addSql(
      `create table "votes" ("slot_id" uuid not null, "voter_id" uuid not null, "choice" "vote_choice" not null, primary key ("slot_id", "voter_id"));`,
    );
    this.addSql(`create index "votes_voter_id_index" on "votes" ("voter_id");`);

    this.addSql(
      `alter table "votes" add constraint "votes_slot_id_foreign" foreign key ("slot_id") references "time_slots" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "votes" add constraint "votes_voter_id_foreign" foreign key ("voter_id") references "users" ("id") on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "votes" cascade;`);

    this.addSql(`drop type "vote_choice";`);
  }
}
