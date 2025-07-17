import { useCookie } from "nuxt/app";
import type { ItemResponse } from "~/types";

export function useToken() {
  const config = useRuntimeConfig();

  const token = useCookie(config.public.accessTokenCookieName, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  const refreshToken = useCookie(config.public.refreshTokenCookieName, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  function getToken() {
    return token.value;
  }

  function setToken(value: string | null) {
    token.value = value;
  }
  function setRefreshToken(value: string | null) {
    refreshToken.value = value;
  }

  function hasToken() {
    return !!token.value;
  }

  async function refresh() {
    try {
      if (!refreshToken.value) {
        throw new Error("not found refresh token");
      }

      const { data, error } = await useFetch<
        ItemResponse<{
          accessToken: string;
          refreshToken: string;
        }>
      >("/auth/refresh-token", {
        baseURL: `${config.public.refreshUrl}`,
        method: "POST",
        body: { accessToken: token, refreshToken },
      });

      if (error.value) {
        throw error;
      }

      if (!data.value?.data) {
        throw new Error("API not response item");
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        data.value.data.item;

      if (!newAccessToken) {
        throw new Error("API not response access token");
      }

      setToken(newAccessToken);

      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
    } catch (error) {
      clear();
      return error;
    }
  }

  function clear() {
    setToken(null);
    setRefreshToken(null);
    // navigateTo(config.public.authUrl, { external: true, replace: true });
  }

  return {
    getToken,
    setToken,
    hasToken,
    setRefreshToken,
    refresh,
    clear,
    token,
  };
}
