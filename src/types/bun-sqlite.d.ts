declare module "bun:sqlite" {
  export class Database {
    constructor(filename: string, options?: { create?: boolean });
    run(sql: string): void;
    prepare<T extends Record<string, unknown> = Record<string, unknown>>(sql: string): {
      all(): T[];
    };
  }
}
