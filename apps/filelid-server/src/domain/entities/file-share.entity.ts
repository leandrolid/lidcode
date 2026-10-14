export type SharedFile = {
  id: string
  shareId: string
  pathname: string
  name: string
  size: number
  contentType: string
}

export class FileShare {
  constructor(
    public id: string,
    public managementTokenHash: string,
    public status: 'uploading' | 'ready' | 'deleting',
    public createdAt: Date,
    public expiresAt: Date,
    public files: SharedFile[] = [],
  ) {}
}
