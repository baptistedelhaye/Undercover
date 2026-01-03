// =====================
// Helpers
// =====================
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ⚠️ words.json attendu en duos : [{ "a": "...", "b": "..." }, ...]
async function loadWordPairs() {
  try {
    const res = await fetch("words.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const cleaned = Array.isArray(data)
      ? data
          .filter(x => x && typeof x.a === "string" && typeof x.b === "string")
          .map(x => ({ a: x.a.trim(), b: x.b.trim() }))
          .filter(x => x.a && x.b && x.a.toLowerCase() !== x.b.toLowerCase())
      : [];

    if (cleaned.length < 1) throw new Error("words.json vide / invalide");

    return { ok: true, pairs: cleaned, info: `✅ ${cleaned.length} duos chargés` };
  } catch (e) {
    console.warn("words.json non chargé, fallback utilisé :", e);
    const fallback = [
      { a: "Fanta", b: "Coca" },
      { a: "Chat", b: "Chien" },
      { a: "Pizza", b: "Burger" }
    ];
    return { ok: false, pairs: fallback, info: "⚠️ words.json non chargé (utilise Live Server / http.server)" };
  }
}

// =====================
// Save / Restore (pseudos + config)
// =====================
const STORAGE_KEY = "mrwhite_settings_v3";

function saveSettings({ names, config }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ names, config }));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =====================
// Player
// =====================
class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.role = null;
    this.word = null;
    this.isAlive = true;
  }

  assignRole(role, word = null) {
    this.role = role;
    this.word = word;
  }

  getCard() {
    if (this.role === "MR_WHITE") return "🤐 Mr White\n(pas de mot)";
    if (this.role === "IMPOSTEUR") return `🕵️ Imposteur\nMot: ${this.word}`;
    return `👤 Civil\nMot: ${this.word}`;
  }

  getCardEmoji() {
    if (this.role === "MR_WHITE") return "🤐";
    if (this.role === "IMPOSTEUR") return "🕵️";
    return "👤";
  }

  eliminate() {
    this.isAlive = false;
  }
}

// =====================
// MrWhiteGame
// =====================
class MrWhiteGame {
  constructor(playerCount, impostorCount, mrWhiteCount, wordPairs) {
    this.playerCount = playerCount;
    this.impostorCount = impostorCount;
    this.mrWhiteCount = mrWhiteCount;
    this.civilCount = playerCount - impostorCount - mrWhiteCount;

    this.players = [];
    this.roundNumber = 0;
    this.gameOver = false;
    this.winner = null;
    this.currentCardIndex = 0;
    this.selectedVote = null;

    // ordre circulaire (starter auto)
    this.turnOrder = [];
    this.turnPointer = 0;

    // guess logic
    // null = si Mr White rate -> on CONTINUE la partie (cas "Mr White éliminé")
    // "Imposteurs" = si Mr White rate -> imposteurs gagnent (cas "Mr White vole la win")
    this.guessFallbackWinner = null;

    this.wordPairs = wordPairs;

    // ✅ choix duo + inversion 50/50
    const pair = this.wordPairs[Math.floor(Math.random() * this.wordPairs.length)];
    if (Math.random() < 0.5) {
      this.civilWord = pair.a;
      this.impostorWord = pair.b;
    } else {
      this.civilWord = pair.b;
      this.impostorWord = pair.a;
    }
  }

  initializeGame(playerNames) {
    for (let i = 1; i <= this.playerCount; i++) {
      const name = (playerNames?.[i - 1] || `Joueur ${i}`).trim();
      this.players.push(new Player(i, name));
    }

    this.distributeRoles();

    // ✅ starter auto random parmi tous les joueurs
    const starterId = Math.floor(Math.random() * this.playerCount) + 1;

    // ordre circulaire starter -> suivants -> retour au début
    const ids = this.players.map(p => p.id);
    const startIndex = ids.indexOf(starterId);
    this.turnOrder = [...ids.slice(startIndex), ...ids.slice(0, startIndex)];
    this.turnPointer = 0;
  }

  distributeRoles() {
    const roles = [];

    for (let i = 0; i < this.civilCount; i++) roles.push({ role: "CIVIL", word: this.civilWord });
    for (let i = 0; i < this.impostorCount; i++) roles.push({ role: "IMPOSTEUR", word: this.impostorWord });
    for (let i = 0; i < this.mrWhiteCount; i++) roles.push({ role: "MR_WHITE", word: null });

    roles.sort(() => Math.random() - 0.5);
    this.players.forEach((p, idx) => p.assignRole(roles[idx].role, roles[idx].word));
  }

  getSpeakingOrder() {
    const aliveIds = new Set(this.players.filter(p => p.isAlive).map(p => p.id));
    const order = [];

    for (let i = 0; i < this.turnOrder.length; i++) {
      const idx = (this.turnPointer + i) % this.turnOrder.length;
      const id = this.turnOrder[idx];
      if (aliveIds.has(id)) order.push(id);
    }
    return order;
  }

  setNextRoundStarterAfter(eliminatedId) {
    const pos = this.turnOrder.indexOf(eliminatedId);
    if (pos === -1) return;

    this.turnPointer = (pos + 1) % this.turnOrder.length;

    // saute les morts
    for (let k = 0; k < this.turnOrder.length; k++) {
      const id = this.turnOrder[this.turnPointer];
      const p = this.players.find(x => x.id === id);
      if (p && p.isAlive) break;
      this.turnPointer = (this.turnPointer + 1) % this.turnOrder.length;
    }
  }

  playRound() {
    this.roundNumber++;
    this.collectClues();
  }

  collectClues() {
    const cluesPhase = document.getElementById("cluesPhase");
    const cluesContainer = document.getElementById("cluesContainer");
    cluesContainer.innerHTML = "";

    const speakingIds = this.getSpeakingOrder();

    speakingIds.forEach((id, i) => {
      const player = this.players.find(p => p.id === id);
      const clueDiv = document.createElement("div");
      clueDiv.className = "clue-item";
      clueDiv.innerHTML = `
        <div class="clue-player">#${i + 1} • ${player.getCardEmoji()} ${player.name}</div>
        <div class="clue-text">"${this.generateClue(player)}"</div>
      `;
      cluesContainer.appendChild(clueDiv);
    });

    document.getElementById("votingPhase").classList.remove("active");
    document.getElementById("revelationPhase").classList.remove("active");
    cluesPhase.classList.add("active");
  }

  generateClue(player) {
    const cluesByRole = {
      MR_WHITE: ["Hmm… intéressant.", "Je vois l’idée, mais pas sûr…", "Ça me dit quelque chose…", "C’est un peu vague…", "Ok… je note."],
      IMPOSTEUR: ["C’est très connu.", "On en trouve facilement.", "Ça plaît à beaucoup de gens.", "Ça se consomme souvent.", "Ça va bien avec une pause."],
      CIVIL: ["Ça a une identité forte.", "On peut reconnaître facilement.", "Ça évoque une couleur / un style.", "C’est assez populaire.", "C’est plutôt simple à décrire."]
    };

    const arr = cluesByRole[player.role];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  toVoting() {
    document.getElementById("cluesPhase").classList.remove("active");
    document.getElementById("revelationPhase").classList.remove("active");
    document.getElementById("votingPhase").classList.add("active");
    this.displayVotingOptions();
  }

  displayVotingOptions() {
    const votingContainer = document.getElementById("votingContainer");
    votingContainer.innerHTML = "";

    this.players.filter(p => p.isAlive).forEach(player => {
      const btn = document.createElement("button");
      btn.className = "btn-vote";
      btn.textContent = player.name;
      btn.onclick = () => this.selectVote(player.id, btn);
      votingContainer.appendChild(btn);
    });
  }

  selectVote(playerId, buttonEl) {
    document.querySelectorAll(".btn-vote").forEach(b => b.classList.remove("selected"));
    buttonEl.classList.add("selected");
    this.selectedVote = playerId;
    document.getElementById("submitVoteBtn").disabled = false;
  }

  submitVote() {
    if (this.selectedVote == null) return;

    const eliminated = this.players.find(p => p.id === this.selectedVote);
    eliminated.eliminate();

    this.setNextRoundStarterAfter(eliminated.id);
    this.showRevelation(eliminated);
  }

  // ✅ ICI: on cache le mot à l'élimination (on affiche juste le rôle)
  showRevelation(player) {
    document.getElementById("votingPhase").classList.remove("active");
    document.getElementById("revelationPhase").classList.add("active");

    const roleText =
      player.role === "MR_WHITE" ? "Mr White" :
      player.role === "IMPOSTEUR" ? "Imposteur" :
      "Civil";

    // Mot caché pendant la partie
    const wordDisplay = player.role === "MR_WHITE" ? "(pas de mot)" : "(mot caché)";

    document.getElementById("revelationContent").innerHTML = `
      <div style="font-size:18px;font-weight:900;margin-bottom:8px;">❌ ${player.name} éliminé</div>
      <div style="font-size:44px;margin:8px 0;">${player.getCardEmoji()}</div>
      <div style="font-weight:900;font-size:18px;margin-bottom:6px;">${roleText}</div>
      <div style="opacity:.95">${wordDisplay}</div>
    `;

    setTimeout(() => this.checkVictoryConditions(player), 800);
  }

  // ✅ règles + chance MrWhite même si imposteurs gagnent (si MrWhite vivant)
checkVictoryConditions(eliminatedPlayer) {
  // ✅ Si Mr White est éliminé : il tente de deviner
  // - s'il trouve : Mr White gagne
  // - s'il rate : la partie continue (comme tu voulais)
  if (eliminatedPlayer.role === "MR_WHITE") {
    this.guessFallbackWinner = null; // pas de win auto
    this.showGuessScreen();
    return;
  }

  const aliveCivils = this.players.filter(p => p.isAlive && p.role === "CIVIL").length;
  const aliveImpostors = this.players.filter(p => p.isAlive && p.role === "IMPOSTEUR").length;
  const aliveMrWhite = this.players.filter(p => p.isAlive && p.role === "MR_WHITE").length;

  // ✅ Si plus aucun méchant (imposteur + mr white) => civils gagnent
  if (aliveImpostors === 0 && aliveMrWhite === 0) {
    this.endGame("Civils");
    return;
  }

  // ✅ RÈGLE IMPORTANTE : égalité = imposteurs gagnent
  // Donc 1 civil vs 1 imposteur => imposteur gagne
  if (aliveImpostors >= aliveCivils) {
    // Si Mr White est encore vivant, il peut tenter de voler la win
    if (aliveMrWhite > 0) {
      this.guessFallbackWinner = "Imposteurs"; // s'il rate => imposteurs gagnent
      this.showGuessScreen();
    } else {
      this.endGame("Imposteurs");
    }
    return;
  }

  // Sinon on continue
  this.continueGame();
}

  showGuessScreen() {
    document.getElementById("gameScreen").classList.remove("active");
    document.getElementById("guessScreen").classList.add("active");
    document.getElementById("guessInput").value = "";
    document.getElementById("guessInput").focus();
  }

  submitGuess() {
    const guess = document.getElementById("guessInput").value.trim().toLowerCase();

    // ✅ Mr White gagne s'il trouve le mot des civils
    if (guess === String(this.civilWord).toLowerCase()) {
      this.endGame("Mr White");
      return;
    }

    // ✅ Si Mr White tentait de "voler la win" (imposteurs >= civils), s'il rate -> imposteurs gagnent
    if (this.guessFallbackWinner) {
      this.endGame(this.guessFallbackWinner);
      return;
    }

    // ✅ Sinon (Mr White éliminé + mauvais mot) -> on CONTINUE la partie
    document.getElementById("guessScreen").classList.remove("active");
    document.getElementById("gameScreen").classList.add("active");
    this.continueGame();
  }

  continueGame() {
    this.selectedVote = null;
    document.querySelectorAll(".btn-vote").forEach(b => b.classList.remove("selected"));
    document.getElementById("submitVoteBtn").disabled = true;

    document.getElementById("revelationPhase").classList.remove("active");

    setTimeout(() => {
      this.playRound();
      this.updateGameStats();
    }, 700);
  }

  updateGameStats() {
    const alive = this.players.filter(p => p.isAlive).length;
    const civ = this.players.filter(p => p.isAlive && p.role === "CIVIL").length;
    const imp = this.players.filter(p => p.isAlive && p.role === "IMPOSTEUR").length;
    const mw = this.players.filter(p => p.isAlive && p.role === "MR_WHITE").length;

    document.getElementById("roundTitle").textContent = `Manche ${this.roundNumber}`;
    document.getElementById("aliveCount").textContent = `👥 ${alive} vivants`;
    document.getElementById("roleCount").textContent = `👤 ${civ} • 🕵️ ${imp} • 🤐 ${mw}`;
  }

  endGame(winner) {
    this.gameOver = true;
    this.winner = winner;
    this.showEndScreen();
  }

  // ✅ ICI: à la fin on affiche seulement le mot des civils (pas les mots par joueur)
  showEndScreen() {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById("endScreen").classList.add("active");

    let msg = "";
    if (this.winner === "Mr White") msg = "🤐 Mr White a deviné le mot !";
    else if (this.winner === "Civils") msg = "👤 Les Civils gagnent !";
    else msg = "🕵️ Les Imposteurs gagnent !";

    document.getElementById("winnerMessage").textContent = msg;

    // Liste joueurs sans mots
    let html = `<div class="player-result" style="font-weight:900;color:var(--txt)"><span>Joueur</span><span>Rôle</span><span>Statut</span></div>`;
    this.players.forEach(p => {
      const role =
        p.role === "MR_WHITE" ? "🤐 Mr White" :
        p.role === "IMPOSTEUR" ? "🕵️ Imposteur" :
        "👤 Civil";

      html += `
        <div class="player-result">
          <span>${escapeHtml(p.name)}</span>
          <span>${role}</span>
          <span>${p.isAlive ? "✅" : "❌"}</span>
        </div>
      `;
    });

    // Mot des civils affiché à la fin
    html += `
      <div class="final" style="margin-top:12px;">
        <div style="font-weight:900;margin-bottom:6px;">📌 Mot des Civils</div>
        <div style="opacity:.95">${escapeHtml(this.civilWord)}</div>
      </div>
    `;

    document.getElementById("finalStats").innerHTML = html;
  }
}

// =====================
// Global state
// =====================
let game;
let cachedWordPairs = [];
let pendingConfig = { playerCount: 6, impostorCount: 1, mrWhiteCount: 1 };
let savedNames = [];

// restore saved
(function initFromStorage() {
  const s = loadSettings();
  if (!s) return;

  if (Array.isArray(s.names)) savedNames = s.names;

  if (s.config && typeof s.config === "object") {
    pendingConfig.playerCount = s.config.playerCount ?? pendingConfig.playerCount;
    pendingConfig.impostorCount = s.config.impostorCount ?? pendingConfig.impostorCount;
    pendingConfig.mrWhiteCount = s.config.mrWhiteCount ?? pendingConfig.mrWhiteCount;
  }
})();

function updateConfigSummary() {
  const playerCount = parseInt(document.getElementById("playerCount").value, 10) || 3;
  const impostorCount = parseInt(document.getElementById("impostorCount").value, 10) || 0;
  const mrWhiteCount = parseInt(document.getElementById("mrWhiteCount").value, 10) || 0;

  const special = impostorCount + mrWhiteCount;
  const civilCount = playerCount - special;

  const errorDiv = document.getElementById("configError");
  const nextBtn = document.getElementById("toNamesBtn");

  let error = "";
  if (playerCount < 3) error = "⚠️ Minimum 3 joueurs.";
  else if (special > playerCount) error = "⚠️ Trop de rôles spéciaux par rapport aux joueurs.";
  else if (civilCount < 1) error = "⚠️ Il faut au moins 1 Civil.";

  const summary = document.getElementById("summaryText");
  if (summary) {
    summary.textContent = `👤 Civils: ${Math.max(0, civilCount)} • 🕵️ Imposteurs: ${impostorCount} • 🤐 Mr White: ${mrWhiteCount}`;
  }

  if (errorDiv) errorDiv.textContent = error;
  if (nextBtn) nextBtn.disabled = Boolean(error);

  pendingConfig = { playerCount, impostorCount, mrWhiteCount };
}

function buildNamesInputs(playerCount) {
  const container = document.getElementById("namesContainer");
  container.innerHTML = "";

  for (let i = 1; i <= playerCount; i++) {
    const defaultName = savedNames[i - 1] || `Joueur ${i}`;

    const div = document.createElement("div");
    div.className = "nameField";
    div.innerHTML = `
      <label>Joueur ${i}</label>
      <input class="textInput" id="name_${i}" type="text" maxlength="18" value="${escapeHtml(defaultName)}" />
    `;
    container.appendChild(div);
  }
}

function readNames(playerCount) {
  const names = [];
  for (let i = 1; i <= playerCount; i++) {
    const v = (document.getElementById(`name_${i}`).value || "").trim();
    names.push(v || `Joueur ${i}`);
  }

  const norm = names.map(n => n.trim().toLowerCase());
  const set = new Set(norm);
  if (set.size !== norm.length) {
    return { ok: false, error: "⚠️ Deux joueurs ont le même pseudo. Mets des pseudos différents.", names };
  }
  return { ok: true, error: "", names };
}

// =====================
// UI Events
// =====================
document.getElementById("startBtn").addEventListener("click", async () => {
  if (cachedWordPairs.length === 0) {
    const loaded = await loadWordPairs();
    cachedWordPairs = loaded.pairs;
    const infoEl = document.getElementById("loadWordsInfo");
    if (infoEl) infoEl.textContent = loaded.info;
  }

  // pré-remplit config
  document.getElementById("playerCount").value = pendingConfig.playerCount;
  document.getElementById("impostorCount").value = pendingConfig.impostorCount;
  document.getElementById("mrWhiteCount").value = pendingConfig.mrWhiteCount;

  showScreen("configScreen");
  updateConfigSummary();
});

document.getElementById("backBtn").addEventListener("click", () => showScreen("startScreen"));

["playerCount", "impostorCount", "mrWhiteCount"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateConfigSummary);
});

document.getElementById("toNamesBtn").addEventListener("click", () => {
  const pc = pendingConfig.playerCount;

  // ajuste savedNames à la nouvelle taille
  savedNames = savedNames.slice(0, pc);
  while (savedNames.length < pc) savedNames.push(`Joueur ${savedNames.length + 1}`);

  buildNamesInputs(pc);
  const err = document.getElementById("namesError");
  if (err) err.textContent = "";

  showScreen("namesScreen");
});

document.getElementById("namesBackBtn").addEventListener("click", () => showScreen("configScreen"));

document.getElementById("namesContinueBtn").addEventListener("click", () => {
  const { playerCount, impostorCount, mrWhiteCount } = pendingConfig;

  const read = readNames(playerCount);
  const err = document.getElementById("namesError");
  if (!read.ok) {
    if (err) err.textContent = read.error;
    return;
  }
  if (err) err.textContent = "";

  savedNames = read.names;

  // sauvegarde config + pseudos pour la prochaine partie
  saveSettings({ names: savedNames, config: pendingConfig });

  game = new MrWhiteGame(playerCount, impostorCount, mrWhiteCount, cachedWordPairs);
  game.initializeGame(savedNames);

  showScreen("cardScreen");
  updateCardDisplay();
});

// Cards flow
function updateCardDisplay() {
  const currentPlayer = game.players[game.currentCardIndex];

  const nameEl = document.getElementById("cardPlayerName");
  if (nameEl) nameEl.textContent = currentPlayer.name;

  const secretCard = document.getElementById("secretCard");
  secretCard.classList.add("hidden");
  secretCard.textContent = "";

  const revealBtn = document.getElementById("revealBtn");
  revealBtn.style.display = "inline-flex";

  const nextBtn = document.getElementById("nextCardBtn");
  nextBtn.disabled = true;

  const idx = document.getElementById("cardIndex");
  if (idx) idx.textContent = `${game.currentCardIndex + 1}/${game.playerCount}`;
}

document.getElementById("revealBtn").addEventListener("click", () => {
  const currentPlayer = game.players[game.currentCardIndex];
  const secretCard = document.getElementById("secretCard");

  secretCard.textContent = currentPlayer.getCard();
  secretCard.classList.remove("hidden");

  document.getElementById("revealBtn").style.display = "none";
  document.getElementById("nextCardBtn").disabled = false;
});

document.getElementById("nextCardBtn").addEventListener("click", () => {
  game.currentCardIndex++;

  if (game.currentCardIndex < game.playerCount) {
    updateCardDisplay();
  } else {
    showScreen("gameScreen");
    game.playRound();
    game.updateGameStats();
  }
});

document.getElementById("toVotingBtn").addEventListener("click", () => game.toVoting());
document.getElementById("submitVoteBtn").addEventListener("click", () => game.submitVote());
document.getElementById("continueGameBtn").addEventListener("click", () => game.continueGame());
document.getElementById("guessSubmitBtn").addEventListener("click", () => game.submitGuess());

// Rejouer -> revenir à la config (pseudos gardés)
document.getElementById("restartBtn").addEventListener("click", () => {
  showScreen("configScreen");
  updateConfigSummary();
});
