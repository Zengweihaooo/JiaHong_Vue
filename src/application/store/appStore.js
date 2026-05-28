import { getAppBootstrap } from "../../infrastructure/api/appApi.js?v=20260527-36";
import { consultationRecords, doctor, hydrateAppData, services } from "../state/dataStore.js";
import { initRuntimeState } from "../state/runtimeState.js?v=20260528-06";

export const appStore = {
  ready: false,
  error: null
};

export async function initAppStore() {
  try {
    const bootstrap = await getAppBootstrap();
    hydrateAppData(bootstrap);
    initRuntimeState({ services, consultationRecords, doctor });
    appStore.ready = true;
    appStore.error = null;
  } catch (error) {
    appStore.ready = false;
    appStore.error = error;
    throw error;
  }
}
