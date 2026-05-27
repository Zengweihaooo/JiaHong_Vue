import { videoPrescriptionSubmitLockSeconds } from "../../domain/consultationRules.js";

export function bindVideoPrescriptionSubmitCountdown() {
  document.querySelectorAll("[data-video-submit-countdown]").forEach((countdown) => {
    if (countdown.dataset.bound === "true") return;
    countdown.dataset.bound = "true";
    const submitButton = countdown.closest(".video-prescription-submit-wrap")?.querySelector(".jh-prescription-submit");
    const value = countdown.querySelector(".video-submit-countdown__value");
    let remaining = Number(countdown.dataset.remaining || videoPrescriptionSubmitLockSeconds);
    const render = () => {
      const safeRemaining = Math.max(0, remaining);
      countdown.dataset.remaining = String(safeRemaining);
      if (value) value.textContent = `${safeRemaining}s`;
      if (submitButton) {
        submitButton.disabled = safeRemaining > 0;
        submitButton.setAttribute("aria-disabled", String(safeRemaining > 0));
      }
      countdown.hidden = safeRemaining <= 0;
    };
    render();
    const timer = window.setInterval(() => {
      remaining -= 1;
      render();
      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);
  });
}
