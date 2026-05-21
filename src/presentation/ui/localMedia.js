let localMediaStream = null;
let localMediaRequest = null;
let localMediaStatus = "idle";
let localMediaErrorReason = "";

function getMediaDevices() {
  return navigator.mediaDevices || null;
}

function hasLiveTracks(stream) {
  return Boolean(stream?.getTracks().some((track) => track.readyState === "live"));
}

function clearInactiveStream() {
  if (!localMediaStream || hasLiveTracks(localMediaStream)) return;
  localMediaStream = null;
  if (localMediaStatus === "ready") localMediaStatus = "idle";
}

function setTrackEnabled(kind, enabled) {
  if (!localMediaStream) return;
  localMediaStream
    .getTracks()
    .filter((track) => track.kind === kind)
    .forEach((track) => {
      track.enabled = enabled;
    });
}

export function setLocalCameraEnabled(enabled) {
  setTrackEnabled("video", enabled);
}

export function setLocalMicrophoneEnabled(enabled) {
  setTrackEnabled("audio", enabled);
}

export function hasLocalMediaStream() {
  clearInactiveStream();
  return hasLiveTracks(localMediaStream);
}

export function getLocalMediaStatus() {
  clearInactiveStream();
  return {
    status: localMediaStatus,
    reason: localMediaErrorReason,
    hasStream: hasLiveTracks(localMediaStream)
  };
}

async function ensureLocalMedia({ forceRetry = false } = {}) {
  if (forceRetry && localMediaStatus === "error") {
    localMediaStatus = "idle";
    localMediaErrorReason = "";
  }
  clearInactiveStream();
  if (hasLiveTracks(localMediaStream)) {
    localMediaStatus = "ready";
    localMediaErrorReason = "";
    return { ok: true, stream: localMediaStream };
  }
  if (localMediaStatus === "error" && !forceRetry) {
    return { ok: false, reason: localMediaErrorReason || "camera-error" };
  }
  const mediaDevices = getMediaDevices();
  if (!mediaDevices?.getUserMedia) {
    localMediaStatus = "error";
    localMediaErrorReason = "unsupported";
    return { ok: false, reason: "unsupported" };
  }

  try {
    if (!localMediaRequest) {
      localMediaStatus = "pending";
      localMediaRequest = mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user"
        },
        audio: true
      });
    }
    localMediaStream = await localMediaRequest;
    localMediaRequest = null;
    localMediaStatus = "ready";
    localMediaErrorReason = "";
    return { ok: true, stream: localMediaStream };
  } catch (error) {
    localMediaRequest = null;
    localMediaStatus = "error";
    localMediaErrorReason = error?.name || "camera-error";
    return {
      ok: false,
      reason: localMediaErrorReason
    };
  }
}

export async function attachLocalCamera(videoElement, { cameraOn = true, micOn = true, forceRetry = false } = {}) {
  if (!videoElement) return { ok: false, reason: "missing-video" };

  const result = await ensureLocalMedia({ forceRetry });
  if (!result.ok) return result;

  videoElement.srcObject = result.stream;
  setLocalCameraEnabled(cameraOn);
  setLocalMicrophoneEnabled(micOn);
  await videoElement.play().catch(() => {});
  return { ok: true };
}
