export interface ItemResponse<T = unknown> {
  apiVersion: string;
  data: {
    title: string;
    description: string;
    item: T;
  };
}

export interface ListResponse<T = unknown> {
  apiVersion: string;
  data: {
    title: string;
    description: string;
    items: T[];
  };
}

export interface ResponseError {
  status: number;
  name: string;
  message: string;
  details: Record<string, string>;
}

export interface ErMigration {
  erCsvImport: string;
  updatedAt: string;
}
