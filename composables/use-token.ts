import type { ItemResponse } from "~/types";

export function useToken() {
  const config = useRuntimeConfig();
  const token = useCookie(config.public.accessTokenCookieName, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  const refreshToken = useCookie(config.public.refreshTokenCookieName, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
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
        baseURL: `${config.public.baseUrl}`,
        method: "POST",
        body: { refreshToken: refreshToken.value },
      });
      if (error.value) {
        throw new Error(
          `Token refresh failed: ${error.value.message || "Unknown error"}`
        );
      }
      if (!data.value?.data) {
        throw new Error("API not response item");
      }
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        data.value.data.item;
      if (!newAccessToken) {
        throw new Error("API not response access token");
      }
      // Validate new access token format
      if (
        !newAccessToken.includes(".") ||
        newAccessToken.split(".").length !== 3
      ) {
        throw new Error("Invalid access token format received");
      }
      setToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
    } catch (error) {
      clear();
      console.error("Token refresh failed:", error);
      navigateTo(config.public.authUrl);
      return error;
    }
  }

  function clear() {
    setToken(null);
    setRefreshToken(null);
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
