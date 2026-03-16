import liff from "@line/liff";

const liffId = import.meta.env.VITE_LIFF_ID;

export async function initLiff() {
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  } catch (error) {
    console.error("LIFF initialization failed", error);
  }
}

export function getLiffProfile() {
  if (liff.isLoggedIn()) {
    return liff.getProfile();
  }
  return null;
}
