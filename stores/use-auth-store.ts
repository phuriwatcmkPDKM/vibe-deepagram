export const useAuthStore = defineStore("auth-store", () => {
  const { getToken } = useToken();

  const user = computed(() => {
    const token = getToken() || "";
    try {
      // Validate basic JWT structure
      if (!token || typeof token !== "string") {
        return undefined;
      }
      const [_header, payload, _signature] = token.split(".");
      if (!payload) {
        return undefined;
      }
      // Validate base64 payload
      if (payload.length === 0) {
        return undefined;
      }
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("JWT decoding failed:", error);
      return undefined;
    }
  });

  const isLoggedIn = computed(() => {
    const userData = user.value;
    if (!userData) return false;

    // Check token expiration if 'exp' claim exists
    if (userData.exp && typeof userData.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      return userData.exp > now;
    }

    return true;
  });

  // TODO : get user / permissions => set user rbac context

  return { isLoggedIn, user };
});

export type AuthStoreState = ReturnType<typeof useAuthStore>;
