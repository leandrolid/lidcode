export type Select<Entity> = {
  [Column in keyof Entity]?: Entity[Column] extends Array<string | number | boolean | Date | null>
    ? true
    : Entity[Column] extends Array<infer I>
      ? Select<I>
      : Entity[Column] extends string | number | boolean | Date | null
        ? true
        : Select<Entity[Column]>
}
