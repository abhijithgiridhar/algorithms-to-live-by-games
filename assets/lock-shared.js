// Generic "answer key" password gate, shared by every game on the site.
// Keeps the reveal (explanation / code / chart) hidden until that game's password is entered.
// Each game has its OWN password and its OWN localStorage key, so unlocking one
// never unlocks another, and the keys/passwords below are the single source of
// truth for every game page and for the homepage reset button.

const GAME_LOCKS = {
  search: { storageKey: "atlb_unlocked_search_v1", password: "258" },
  rishta: { storageKey: "atlb_unlocked_rishta_v1", password: "176" },
  secretary: { storageKey: "atlb_unlocked_secretary_v1", password: "134" },
  parking: { storageKey: "atlb_unlocked_parking_v1", password: "585" },
  selling: { storageKey: "atlb_unlocked_selling_v1", password: "991" },
  quitting: { storageKey: "atlb_unlocked_quitting_v1", password: "838" },
};

// opts: { game, lockPanelEl, passwordInputEl, unlockBtnEl, lockErrorEl, contentEl, noteEl }
// game: one of the keys in GAME_LOCKS above.
// noteEl (optional): a neutral "round complete, ask for the password" element hidden once unlocked.
function initGameLock(opts) {
  const { game, lockPanelEl, passwordInputEl, unlockBtnEl, lockErrorEl, contentEl, noteEl } = opts;
  const { storageKey, password } = GAME_LOCKS[game];

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
    if (noteEl) noteEl.style.display = "none";
  }

  function attemptUnlock() {
    if (passwordInputEl.value.trim() === password) {
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
    isUnlocked,
  };
}
