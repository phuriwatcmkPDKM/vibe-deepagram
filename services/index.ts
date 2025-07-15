import type { ErMigration, ItemResponse } from "~/types";

export function getErMigration(projectId: string) {
  return useApi<ItemResponse<ErMigration>>(
    `/management/projects/${projectId}/er-migration`
  );
}
