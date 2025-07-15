import type { UseFetchOptions } from "nuxt/app";
import { useFetch, createError, useRuntimeConfig } from "nuxt/app";
import { defu } from "defu";

export type FetchOptions<T> = UseFetchOptions<T> & { timeout?: number };

export function useApi<T = unknown>(
  url: string | (() => string),
  userOptions: FetchOptions<T> = {}
) {
  const config = useRuntimeConfig();
  const token = useToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(
      createError({
        statusCode: 408,
        statusMessage: "aborted",
        message: "This request has been automatically aborted.",
      })
    );
  }, userOptions.timeout);

  const defaultOptions: FetchOptions<T> = {
    baseURL: config.public.baseUrl,
    method: "GET",
    retry: 3,
    retryStatusCodes: [401],
    signal: userOptions.timeout ? controller.signal : undefined,

    onRequest({ options }) {
      const headers = new Headers(options.headers);

      if (token.hasToken()) {
        headers.set("Authorization", `Bearer ${token.getToken()}`);
        headers.set("Accept", "application/json");
        headers.set("Content-type", "application/json");
      }

      options.headers = headers;
    },

    async onResponseError({ response }) {
      if (response.status === 401) {
        await token.refresh();
      }
    },
  };

  const options = defu(userOptions, defaultOptions) as UseFetchOptions<T>;

  return useFetch(url, options).finally(() => {
    if (userOptions.timeout && timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export type UseApiReturnType<T> = ReturnType<typeof useApi<T>>;
