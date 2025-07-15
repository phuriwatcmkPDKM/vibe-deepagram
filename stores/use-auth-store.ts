export const useAuthStore = defineStore("auth-store", () => {
  const { getToken } = useToken();

  // TODO : replace with get user info
  const user = computed(() => {
    const token = getToken() || "";

    const [_header, payload, _signature] = token.split(".");
    if (!payload) {
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
  });

  const isLoggedIn = computed(() => {
    return !!user.value;
  });

  // TODO : get user / permissions => set user rbac context

  return { isLoggedIn, user };
});

export type AuthStoreState = ReturnType<typeof useAuthStore>;
