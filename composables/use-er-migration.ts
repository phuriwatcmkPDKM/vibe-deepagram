import { getErMigration } from "~/services";
import type { ErMigration } from "~/types";

export function useErMigration(projectId: string) {
  const data = ref<ErMigration | null>(null);
  const error = ref<Error | null>(null);
  const isLoading = ref<boolean>(true);

  async function fetchData() {
    try {
      isLoading.value = true;

      const { data: responseData, error: responseError } = await getErMigration(
        projectId
      );

      if (responseError.value) {
        throw responseError.value;
      }

      if (!responseData.value?.data) {
        throw new Error("No data response from server");
      }

      data.value = responseData.value.data.item;
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => nextTick(fetchData));

  return { data, error, isLoading, refresh: fetchData };
}
