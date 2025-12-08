export class ShortenedUrl {
  constructor(
    public id: number,
    public originalUrl: string,
    public shortCode: string,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
  ) {}
}
