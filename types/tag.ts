export interface Tag {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagData {
  name: string;
  slug: string;
  imageUrl: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTagData {
  name?: string;
  slug?: string;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}
