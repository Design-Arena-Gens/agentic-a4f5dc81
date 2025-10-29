const button = document.getElementById("navigate-button");
const statusMessage = document.getElementById("status-message");

let resetTimer = null;

const setStatus = (text, state) => {
  statusMessage.textContent = text;
  statusMessage.classList.remove("error", "success");
  if (state) {
    statusMessage.classList.add(state);
  }
  if (resetTimer) {
    clearTimeout(resetTimer);
  }
  if (state === "success") {
    resetTimer = setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.classList.remove("success");
      resetTimer = null;
    }, 3000);
  }
};

const handleAction = () => {
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  setStatus("Locating Speed's latest upload…");

  chrome.runtime.sendMessage({ action: "goToLatestVideo" }, (response) => {
    button.disabled = false;
    button.removeAttribute("aria-busy");

    if (chrome.runtime.lastError) {
      setStatus(
        "Extension error. Please retry.",
        "error"
      );
      console.error(chrome.runtime.lastError);
      return;
    }

    if (response?.success) {
      setStatus(response.message ?? "Opened the latest upload!", "success");
    } else {
      setStatus(
        response?.message ??
          "Could not find Speed's most recent video. Try again soon.",
        "error"
      );
    }
  });
};

button.addEventListener("click", handleAction);
button.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleAction();
  }
});
