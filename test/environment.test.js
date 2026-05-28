import test from "node:test";
import assert from "node:assert/strict";

function createMemoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
    dump() {
      return Object.fromEntries(entries);
    }
  };
}

function setGlobalProperty(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value
  });
}

test("runtime environment uses fallback storage, browser storage, and navigation entries", async () => {
  delete globalThis.sessionStorage;
  delete globalThis.performance;

  const fallbackEnv = await import("../src/infrastructure/browser/runtimeEnvironment.js?env-fallback");
  const fallbackStorage = fallbackEnv.getSessionStorage();
  fallbackStorage.setItem("key", 123);

  assert.equal(fallbackStorage.getItem("key"), "123");
  assert.equal(fallbackEnv.getNavigationEntry(), null);

  const browserStorage = createMemoryStorage();
  const navigationEntry = { type: "reload" };
  setGlobalProperty("sessionStorage", browserStorage);
  setGlobalProperty("performance", {
    getEntriesByType(type) {
      return type === "navigation" ? [navigationEntry] : [];
    }
  });

  const browserEnv = await import("../src/infrastructure/browser/runtimeEnvironment.js?env-browser");

  assert.equal(browserEnv.getSessionStorage(), browserStorage);
  assert.equal(browserEnv.getNavigationEntry(), navigationEntry);
});

test("mock runtime state reads, writes, trims consultations, and keeps chats in sync", async (t) => {
  const storage = createMemoryStorage({
    "jh.mockRuntimeState": JSON.stringify({ schemaVersion: 1, stale: true })
  });
  setGlobalProperty("sessionStorage", storage);
  t.mock.method(Math, "random", () => 0);

  const {
    getRuntimeConsultations,
    readRuntimeState,
    writeRuntimeChat,
    writeRuntimeConsultation,
    writeRuntimeState
  } = await import("../src/infrastructure/api/mockRuntimeState.js?env-runtime-state");

  assert.deepEqual(readRuntimeState(), {});

  writeRuntimeState({
    consultationRecords: [
      { id: "r1", state: "ongoing" },
      { id: "r2", state: "ongoing" }
    ],
    ongoingChats: {
      r1: { messages: ["one"] },
      r2: { messages: ["two"] }
    }
  });

  const next = writeRuntimeConsultation(
    { id: "r3", state: "ongoing" },
    { messages: ["three"] },
    {
      maxRuntimeConsultations: 3,
      baseWaitingQueue: { total: 1 }
    }
  );

  assert.deepEqual(
    next.records.map((record) => record.id),
    ["r3", "r1"]
  );
  assert.deepEqual(Object.keys(next.chats).sort(), ["r1", "r3"]);
  assert.deepEqual(getRuntimeConsultations().chats.r3, { messages: ["three"] });

  const duplicate = writeRuntimeConsultation(
    { id: "r3", state: "ongoing" },
    { messages: ["duplicate"] },
    {
      maxRuntimeConsultations: 3,
      baseWaitingQueue: { total: 1 }
    }
  );

  assert.deepEqual(
    duplicate.records.map((record) => record.id),
    ["r3", "r1"]
  );
  assert.deepEqual(duplicate.chats.r3, { messages: ["three"] });

  writeRuntimeChat("r4", { messages: ["four"] });
  assert.deepEqual(readRuntimeState().ongoingChats.r4, { messages: ["four"] });
});

test("local media reports unsupported state and honors force retry after errors", async () => {
  setGlobalProperty("navigator", {});
  const media = await import("../src/presentation/ui/localMedia.js?local-media-unsupported");

  assert.equal(media.hasLocalMediaStream(), false);
  assert.deepEqual(media.getLocalMediaStatus(), {
    status: "idle",
    reason: "",
    hasStream: false
  });
  assert.deepEqual(await media.attachLocalCamera(null), {
    ok: false,
    reason: "missing-video"
  });
  assert.deepEqual(await media.attachLocalCamera({ play: async () => {} }), {
    ok: false,
    reason: "unsupported"
  });
  assert.deepEqual(media.getLocalMediaStatus(), {
    status: "error",
    reason: "unsupported",
    hasStream: false
  });
});

test("local media attaches streams, toggles tracks, clears inactive streams, and retries failures", async () => {
  let failNextRequest = true;
  const tracks = [
    { kind: "video", enabled: true, readyState: "live" },
    { kind: "audio", enabled: true, readyState: "live" }
  ];
  const stream = {
    getTracks() {
      return tracks;
    }
  };
  setGlobalProperty("navigator", {
    mediaDevices: {
      async getUserMedia() {
        if (failNextRequest) {
          failNextRequest = false;
          const error = new Error("denied");
          error.name = "NotAllowedError";
          throw error;
        }
        return stream;
      }
    }
  });
  const media = await import("../src/presentation/ui/localMedia.js?local-media-ready");
  const videoElement = {
    srcObject: null,
    playCalls: 0,
    async play() {
      this.playCalls += 1;
    }
  };

  assert.deepEqual(await media.attachLocalCamera(videoElement), {
    ok: false,
    reason: "NotAllowedError"
  });
  assert.deepEqual(await media.attachLocalCamera(videoElement), {
    ok: false,
    reason: "NotAllowedError"
  });

  assert.deepEqual(await media.attachLocalCamera(videoElement, { cameraOn: false, micOn: true, forceRetry: true }), {
    ok: true
  });
  assert.equal(videoElement.srcObject, stream);
  assert.equal(videoElement.playCalls, 1);
  assert.equal(tracks[0].enabled, false);
  assert.equal(tracks[1].enabled, true);
  assert.equal(media.hasLocalMediaStream(), true);

  media.setLocalCameraEnabled(true);
  media.setLocalMicrophoneEnabled(false);
  assert.equal(tracks[0].enabled, true);
  assert.equal(tracks[1].enabled, false);

  tracks.forEach((track) => {
    track.readyState = "ended";
  });
  assert.equal(media.hasLocalMediaStream(), false);
  assert.deepEqual(media.getLocalMediaStatus(), {
    status: "idle",
    reason: "",
    hasStream: false
  });
});
