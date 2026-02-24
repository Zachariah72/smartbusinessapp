export class BaseRepository {
  protected readonly table: string;

  constructor(table: string) {
    this.table = table;
  }
}
