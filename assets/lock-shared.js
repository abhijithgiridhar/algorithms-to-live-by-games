// Generic "answer key" password gate, shared by every game on the site.
// Keeps the reveal (explanation / code / chart) hidden until the class password is entered.

const GAME_PASSWORD = "67";

// opts: { storageKey, lockPanelEl, passwordInputEl, unlockBtnEl, lockErrorEl, contentEl }
function initGameLock(opts) {
  const { storageKey, lockPanelEl, passwordInputEl, unlockBtnEl, lockErrorEl, contentEl } = opts;

  function isUnlocked() {
    return localStorage.getItem(storageKey) === "yes";
  }

  function showLocked() {
    lockPanelEl.style.display = "block";
    contentEl.style.display = "none";
  }

  function showUnlocked() {
    lockPanelEl.style.display = "none";
    contentEl.style.display = "block";
  }

  function attemptUnlock() {
    if (passwordInputEl.value.trim() === GAME_PASSWORD) {
      localStorage.setItem(storageKey, "yes");
      lockErrorEl.style.display = "none";
      passwordInputEl.value = "";
      showUnlocked();
    } else {
      lockErrorEl.style.display = "block";
    }
  }

  unlockBtnEl.addEventListener("click", attemptUnlock);
  passwordInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptUnlock();
  });

  return {
    reveal() {
      if (isUnlocked()) showUnlocked();
      else showLocked();
    },
  };
}
