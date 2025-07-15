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
