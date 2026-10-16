import { Migration } from '@mikro-orm/migrations';

export class Migration20261016111140_finalize extends Migration {
  override name = 'Migration20261016111140_finalize';

  override up(): void | Promise<void> {
    this.addSql(`alter table "events" add "finalized_slot_id" uuid null;`);
    this.addSql(
      `alter table "events" add constraint "events_finalized_slot_id_foreign" foreign key ("finalized_slot_id") references "time_slots" ("id") on delete set null;`,
    );
    this.addSql(
      `create index "events_finalized_slot_id_index" on "events" ("finalized_slot_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "events" drop constraint "events_finalized_slot_id_foreign";`,
    );

    this.addSql(`drop index "events_finalized_slot_id_index";`);
    this.addSql(`alter table "events" drop column "finalized_slot_id";`);
  }
}
