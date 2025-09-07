// Global variables to hold our prompts and app state.
let prompts = [];
let availablePrompts = [];
let currentPromptIndex = 0;
let completedEntries = [];
let completedPrompts = [];
let entryCount = 0;
let reflectionIsDue = false;
let hasCompletedFirstReflection = false;
let availableReflections = [];
let currentReflectionIndex = 0;
let evaluationsCompletedCount = 0;
let evaluationIsDue = false;
let initiativeIsDue = false;
let currentProgressAccountEntry = null;
let currentDeeperInsightEntry = null;
let currentInitiativeEntry = null;
let currentInitiativeDeeperIndex = null;
let currentProgressAccountDeeperIndex = null;
let pendingInitiativeIcon = null;
let didShowPopupThisSession = sessionStorage.getItem('didShowPopupThisSession') === 'true';
let consecutivePopupsCount = parseInt(localStorage.getItem('consecutivePopupsCount') || "0", 10);
let trophies = [];
let activityCount = parseInt(localStorage.getItem('activityCount') || "0", 10);

document.addEventListener('DOMContentLoaded', function() {

// Select HTML Elements
const promptSymbol = document.getElementById('prompt-symbol');
const promptTitle = document.getElementById('prompt-title');
const promptText = document.getElementById('prompt-text');
const supplementText = document.getElementById('supplement-text');
const prevButton = document.getElementById('prev-prompt');
const nextButton = document.getElementById('next-prompt');
const completeButton = document.getElementById('complete-entry');
const evaluationButton = document.getElementById('evaluation-button');
const reflectionSummaryDisplay = document.getElementById('reflection-summary-display');
const reflectionDateDisplay = document.getElementById('reflection-date-display');
const prevReflectionButton = document.getElementById('prev-reflection');
const nextReflectionButton = document.getElementById('next-reflection');
const completeReflectionButton = document.getElementById('complete-reflection');

// Select modal elements
const summaryModal = document.getElementById('summary-modal');
const summaryInput = document.getElementById('summary-input');
const saveSummaryButton = document.getElementById('save-summary');
const cancelSummaryButton = document.getElementById('cancel-summary');

const reflectionModal = document.getElementById('reflection-modal');
const reflectionCount = document.getElementById('reflection-count');
const reflectionList = document.getElementById('reflection-list');
const closeReflectionButton = document.getElementById('close-reflection');
const showEvaluationButton = document.getElementById('show-evaluation');

const reflectionInputModal = document.getElementById('reflection-input-modal');
const reflectionPatternInput = document.getElementById('reflection-pattern-input');
const saveReflectionPatternButton = document.getElementById('save-reflection-pattern');
const reflectionPatternErrorModal = document.getElementById('reflection-pattern-error-modal');
const confirmReflectionPatternErrorButton = document.getElementById('confirm-reflection-pattern-error');

const evaluationModal = document.getElementById('evaluation-modal');
const evaluationPrompts = document.getElementById('evaluation-prompts');
const closeEvaluationButton = document.getElementById('close-evaluation');

// Select initiative modal elements
const initiativeModal = document.getElementById('initiative-modal');
const initiativePromptText = document.getElementById('initiative-prompt-text');
const maintainButton = document.getElementById('maintain-button');
const evolveButton = document.getElementById('evolve-button');
const disruptButton = document.getElementById('disrupt-button');
const cancelInitiativeButton = document.getElementById('cancel-initiative-button');

const progressAccountModal = document.getElementById('progress-account-modal');
const progressAccountPrompt = document.getElementById('progress-account-prompt');
const progressAccountInput = document.getElementById('progress-account-input');
const progressMaintainBtn = document.getElementById('progress-maintain-btn');
const progressEvolveBtn = document.getElementById('progress-evolve-btn');
const progressDisruptBtn = document.getElementById('progress-disrupt-btn');
const progressAccountCancelBtn = document.getElementById('progress-account-cancel-btn');
const progressAccountErrorModal = document.getElementById('progress-account-error-modal');
const confirmProgressAccountErrorButton = document.getElementById('confirm-progress-account-error');

const deeperInsightModal = document.getElementById('deeper-insight-modal');
const deeperInsightPrompt = document.getElementById('deeper-insight-prompt');
const deeperInsightInput = document.getElementById('deeper-insight-input');
const saveDeeperInsightButton = document.getElementById('save-deeper-insight');
const cancelDeeperInsightButton = document.getElementById('cancel-deeper-insight');

const saveTxtFileButton = document.getElementById('save-txt-file');

const TROPHY_STORAGE_KEY = 'trophies';


confirmProgressAccountErrorButton.onclick = () => {
    progressAccountErrorModal.classList.remove('visible');
    progressAccountModal.classList.add('visible');
    setTimeout(() => {
        progressAccountInput.focus();
        progressAccountInput.select();
    }, 10);
};





// Helper function to display a prompt on the page.
function displayPrompt(prompt) {
if (!prompt) {
    // Handle case where all prompts are completed
    promptSymbol.textContent = "";
    promptTitle.textContent = "Today's prompts completed!";
    promptText.textContent = "You can evaluate below, or close the app and reopen to receive the next pop-up activity. Pulling down to refresh will begin any eligible Deeper Insight activities due.";
    supplementText.textContent = "";

    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
    completeButton.style.display = 'none';
    evaluationButton.style.display = 'block'; // <-- keep the Evaluation button visible
    return;
}
    
    promptSymbol.textContent = prompt.symbol;
    promptTitle.textContent = prompt.title;
    promptText.textContent = prompt.prompt;
    supplementText.textContent = prompt.supplement;
    
    // Ensure buttons are visible
    prevButton.style.display = '';
    nextButton.style.display = '';
    completeButton.style.display = '';
    
    // Show evaluation button if the condition is met
    if (hasCompletedFirstReflection) {
        evaluationButton.style.display = 'block';
    } else {
        evaluationButton.style.display = 'none';
    }
}

function loadTrophies() {
    const savedTrophies = localStorage.getItem(TROPHY_STORAGE_KEY);
    if (savedTrophies) {
        try {
            trophies = JSON.parse(savedTrophies);
        } catch (e) {
            trophies = [];
        }
    }
}
loadTrophies();




// Function to save an entry to localStorage.
function saveEntry(promptData, summary, reflectionSummary = null) {
    const entry = {
        id: promptData.id,
        symbol: promptData.symbol,
        title: promptData.title,
        summary: summary,
        completedAt: new Date().toISOString(),
        reflectionSummary: reflectionSummary // Default to null
    };
    
    completedEntries.push(entry);
    completedPrompts.push(promptData.id);
    
    localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
    localStorage.setItem('completedPrompts', JSON.stringify(completedPrompts));
    
    entryCount++;
    localStorage.setItem('entryCount', entryCount);
	checkShowEvalReminder();
	updateStreak();
	incrementActivityCount('Wrote Main Entry');
    
    if (entryCount > 0 && entryCount % 5 === 0) { // Use 2 for testing
        reflectionIsDue = true;
        localStorage.setItem('reflectionIsDue', 'true');
		showStreakInHeader();
		checkEvaluationGlow();
    }
}

// Function to load all data from localStorage and prompts from the JSON file.
async function loadDataAndPrompts() {
    // 1. Load data from localStorage first
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
        completedEntries = JSON.parse(savedEntries);
        upgradeCompletedEntries();
    }

    const savedCompletedPrompts = localStorage.getItem('completedPrompts');
    if (savedCompletedPrompts) {
        completedPrompts = JSON.parse(savedCompletedPrompts);
    }

    const savedCount = localStorage.getItem('entryCount');
    if (savedCount) {
        entryCount = parseInt(savedCount, 10);
    }

    const savedReflectionFlag = localStorage.getItem('reflectionIsDue');
    if (savedReflectionFlag === 'true') {
        reflectionIsDue = true;
    }

    const savedFirstReflectionFlag = localStorage.getItem('hasCompletedFirstReflection');
    if (savedFirstReflectionFlag === 'true') {
        hasCompletedFirstReflection = true;
    }

    try {
        const response = await fetch('prompts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allPrompts = await response.json();

        availablePrompts = allPrompts.filter(prompt => !completedPrompts.includes(prompt.id));

        findReflectionsDue();
        const evaluationsDue = findEvaluationsDue();
        const nextInitiative = findNextInitiativeDue();
        const deeperDue = findEntriesDueForDeeperInsight();
        
        // --- NEW LOGIC: Check if it's time to force a main prompt ---
        const popupActivitiesDue = nextInitiative || (evaluationIsDue && evaluationsDue.length > 0) || (reflectionIsDue && availableReflections.length > 0) || deeperDue.length > 0;
        
        if (popupActivitiesDue && availablePrompts.length > 0 && consecutivePopupsCount >= 2) { // 👈 Change timing here, 2 for testing
            // Force a main prompt to show and reset the popup counter
            displayPrompt(availablePrompts[currentPromptIndex]);
            consecutivePopupsCount = 0;
            localStorage.setItem('consecutivePopupsCount', "0");
            return;
        }

        // --- Only show one pop-up per session ---
        if (!didShowPopupThisSession) {
            if (nextInitiative) {
                didShowPopupThisSession = true;
                sessionStorage.setItem('didShowPopupThisSession', 'true');
                consecutivePopupsCount++;
                localStorage.setItem('consecutivePopupsCount', String(consecutivePopupsCount));
                showInitiativePrompt(nextInitiative); 
                return;
            }
            if (evaluationIsDue && evaluationsDue.length > 0) {
                didShowPopupThisSession = true;
                sessionStorage.setItem('didShowPopupThisSession', 'true');
                consecutivePopupsCount++;
                localStorage.setItem('consecutivePopupsCount', String(consecutivePopupsCount));
                showEvaluationModal();
                return;
            }
            if (reflectionIsDue && availableReflections.length > 0) {
                didShowPopupThisSession = true;
                sessionStorage.setItem('didShowPopupThisSession', 'true');
                consecutivePopupsCount++;
                localStorage.setItem('consecutivePopupsCount', String(consecutivePopupsCount));
                showReflectionModal();
                return;
            }
            if (deeperDue.length > 0) {
                didShowPopupThisSession = true;
                sessionStorage.setItem('didShowPopupThisSession', 'true');
                consecutivePopupsCount++;
                localStorage.setItem('consecutivePopupsCount', String(consecutivePopupsCount));
                showDeeperInsightModal(deeperDue[0]);
                return;
            }
        }

        // If nothing else is due or a pop-up has already been shown, display the main prompt
        displayPrompt(availablePrompts.length > 0 ? availablePrompts[currentPromptIndex] : null);
        
        // --- NEW: Reset popup count when a main prompt is shown ---
        consecutivePopupsCount = 0;
        localStorage.setItem('consecutivePopupsCount', "0");

    } catch (error) {
        console.error('Could not load prompts:', error);
        promptText.textContent = 'Failed to load prompts. Please check the prompts.json file.';
    }
}

function findReflectionsDue() {
    availableReflections = completedEntries.filter(entry => entry.reflectionSummary === null);
}


// Helper function to show the summary modal.
function showSummaryModal() {
    summaryInput.value = "";
    summaryModal.classList.add('visible');
    setTimeout(() => {
        summaryInput.focus();
        summaryInput.select();
    }, 80); // 50ms has been working 80 seems like perfect overthinking lol
}

// Helper function to display a single reflection prompt
function displayReflectionPrompt(entry) {
    if (!entry) {
        // Handle case where no reflections are due
        reflectionSummaryDisplay.textContent = "No reflections are currently due.";
        reflectionDateDisplay.textContent = "";
        prevReflectionButton.style.display = 'none';
        nextReflectionButton.style.display = 'none';
        completeReflectionButton.style.display = 'none';
        return;
    }
    
    reflectionSummaryDisplay.textContent = `${entry.symbol ? `${entry.symbol} ` : ''}${entry.summary}`;
    reflectionDateDisplay.textContent = new Date(entry.completedAt).toLocaleDateString();
    
    // Show/hide navigation based on number of available reflections
    if (availableReflections.length <= 1) {
        prevReflectionButton.style.display = 'none';
        nextReflectionButton.style.display = 'none';
    } else {
        prevReflectionButton.style.display = 'block';
        nextReflectionButton.style.display = 'block';
    }
    
    completeReflectionButton.style.display = 'block';
}

// Function to show the reflection modal and its content
function showReflectionModal() {
    findReflectionsDue();
    if (availableReflections.length > 0) {
        currentReflectionIndex = 0;
        displayReflectionPrompt(availableReflections[currentReflectionIndex]);
        reflectionModal.classList.add('visible');
    } else {
        hideAllModals(); // Hide if nothing is due
        // Fallback to display the main prompt if no reflections are due
        if (availablePrompts.length > 0) {
            displayPrompt(availablePrompts[currentPromptIndex]);
        } else {
            displayPrompt(null);
        }
    }
}

function showReflectionInputModal(entry, onSave) {
    reflectionPatternInput.value = "";
    reflectionInputModal.classList.add('visible');
    setTimeout(() => {
        reflectionPatternInput.focus();
        reflectionPatternInput.select();
    }, 80);

    // Save handler
    saveReflectionPatternButton.onclick = () => {
        const patternValue = reflectionPatternInput.value.trim();
        if (!patternValue) {
            reflectionInputModal.classList.remove('visible');
            reflectionPatternErrorModal.classList.add('visible');
            return;
        }
        reflectionInputModal.classList.remove('visible');
        onSave(patternValue);
    };
}

// ---- Error modal handler ----
confirmReflectionPatternErrorButton.onclick = () => {
    reflectionPatternErrorModal.classList.remove('visible');
    reflectionInputModal.classList.add('visible');
    reflectionPatternInput.focus();
};



// Function to show the evaluation modal.
function showEvaluationModal() {
    document.body.classList.add('modal-open');
    evaluationModal.classList.add('visible');
    evaluationPrompts.innerHTML = ''; // Clear previous items

    // Gather all reflections (top-level and deeper)
    let allReflections = [];

    completedEntries.forEach(entry => {
        // Top-level reflection
        if (entry.reflectionSummary) {
            allReflections.push({
                type: "arc",
                symbol: entry.symbol,
                summary: entry.summary,
                reflectionSummary: entry.reflectionSummary,
                initiative: entry.initiative,
                progressAccountedAt: entry.progressAccountedAt,
                progressReflection: entry.progressReflection,
                progressInitiative: entry.progressInitiative,
                initiativeReason: entry.initiativeReason,
                completedAt: entry.completedAt,
                isDeeper: false,
                parentEntry: entry,
                deeperIndex: null,
            });
        }
        // Deeper reflections
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach((deep, dIdx) => {
                if (deep.summary) { // show even if not arc-complete
                    allReflections.push({
                        type: "arc",
                        symbol: entry.symbol,
                        summary: entry.summary,
                        reflectionSummary: deep.summary,
                        initiative: deep.initiative,
                        progressAccountedAt: deep.progressAccountedAt,
                        progressReflection: deep.progressReflection,
                        progressInitiative: deep.progressInitiative,
                        initiativeReason: deep.initiativeReason,
                        completedAt: deep.completedAt || entry.completedAt, // fallback
                        isDeeper: true,
                        parentEntry: entry,
                        deeperIndex: dIdx,
                    });
                }
            });
        }
    });

    // Gather all non-arc trophies (assume trophies is available in scope)
    let allTrophies = (trophies || []).map(trophy => ({
        ...trophy,
        type: "trophy",
        completedAt: trophy.earnedAt
    }));

    // Merge and sort by completedAt/earnedAt
    let combined = [...allReflections, ...allTrophies].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    if (combined.length === 0) {
        evaluationPrompts.textContent = "You have not completed any reflections or earned trophies yet.";
        return;
    }

    combined.forEach(item => {
        const div = document.createElement('div');
        if (item.type === "arc") {
            // Show trophy only if arc is complete
            let trophy = item.progressAccountedAt ? '<span class="trophy">🏆</span> ' : '';
            div.className = 'evaluation-prompt';
            if (item.progressAccountedAt) div.classList.add('completed-arc');
            if (item.reflectionSummary && item.initiative && !item.progressAccountedAt) div.classList.add('afp-eligible');
            if (!item.initiative) div.classList.add('needs-initiative');

            div.innerHTML = `${trophy}<strong>${item.symbol}</strong> - "${item.reflectionSummary}"` +
                (item.isDeeper ? ' <span style="font-size:0.8em;opacity:0.7;">(deeper insight)</span>' : '');

            div.addEventListener('click', () => {
                let reflectionObj;
                if (!item.isDeeper) {
                    reflectionObj = item.parentEntry;
                } else {
                    reflectionObj = item.parentEntry.deeperReflections[item.deeperIndex];
                }
                // Must handle 3 states: needs initiative, needs progress account, arc complete
                if (reflectionObj.initiative === undefined || reflectionObj.initiative === null) {
                    if (item.isDeeper) {
                        showInitiativePromptForReflection(item.parentEntry, item.deeperIndex);
                    } else {
                        showInitiativePrompt(item.parentEntry);
                    }
                } else if (
                    item.reflectionSummary &&
                    reflectionObj.initiative &&
                    !reflectionObj.progressAccountedAt
                ) {
                    if (item.isDeeper) {
                        showProgressAccountModalForReflection(item.parentEntry, item.deeperIndex);
                    } else {
                        showProgressAccountModal(item.parentEntry);
                    }
                } else {
                    let msg = `Symbol: ${item.symbol || ''}\nEntry Topic: ${item.summary}
Pattern Found: ${item.reflectionSummary}
Choice Made: ${reflectionObj.initiative || 'N/A'}${reflectionObj.progressInitiative ? ` (and saw ${reflectionObj.progressInitiative} as an outcome)` : ''}
Actions Taken: ${reflectionObj.progressReflection ? reflectionObj.progressReflection : 'N/A'}
Initiative Reason: ${reflectionObj.initiativeReason || 'N/A'}
Entry Recorded: ${reflectionObj.completedAt ? new Date(reflectionObj.completedAt).toLocaleDateString() : 'N/A'}
Progress Accounted At: ${reflectionObj.progressAccountedAt ? new Date(reflectionObj.progressAccountedAt).toLocaleDateString() : 'N/A'}
`;
                    alert(msg);
                }
            });
        } else if (item.type === "trophy") {
            div.className = 'evaluation-prompt trophy-not-arc';
            div.innerHTML = `${item.label}`;
            div.title = item.description;
            div.onclick = () => showTrophyModal(item.label, item.description);
        }
        evaluationPrompts.appendChild(div);
    });

    // --- Triad Summary Button ---
    const triadBtn = document.createElement('button');
    triadBtn.id = 'triad-summary-button';
    triadBtn.textContent = 'Show Triad Summary';
    triadBtn.className = 'choice-button'; // uses your native style
    triadBtn.style.margin = "1em auto 0.7em auto";
    triadBtn.onclick = showTriadSummaryModal;
    evaluationPrompts.appendChild(triadBtn);

    // --- Stat Sheet at Bottom ---
    const stats = buildStats();
    const statDiv = document.createElement('div');
    statDiv.className = 'evaluation-stats';
	statDiv.innerHTML = `
  	  <hr>
  	  <div style="font-size:1.08em;text-align:left;line-height:1.55;margin-top:1.3em;">
 	       <strong>Days Since First Entry:</strong> ${stats.daysSinceFirstEntry}<br>
		   <strong>Days Since Last Active:</strong> ${stats.daysSinceLastActive}<br>
 	       <strong>Main Entries Written:</strong> ${stats.totalActivities}<br>
 	       <strong>Total Activities Completed:</strong> ${stats.activityCount}<br>
   	       <strong>Awards Earned:</strong> ${stats.awardsEarned}<br>
     	   <strong>Current Streak:</strong> ${stats.streak} days<br>
      	   <strong>Longest Streak:</strong> ${stats.longestStreak} days<br>
		   <strong>Longest Inactive Streak:</strong> ${stats.longestInactive} days<br>
   	       <strong>Completed Arc Trophies:</strong> ${stats.arcTrophies}<br>
     	   <strong>Alignment:</strong> ${stats.alignment}%<br>
		   <strong>Score:</strong> ${stats.score}<br>
    </div>
`;
    evaluationPrompts.appendChild(statDiv);
}

function showTriadSummaryModal() {
    // Core symbol definitions
const identityCore = ["Δ.1: Delta 1", "Ω.1: Omega 1", "Ψ: Psi", "Λ: Lambda", "Θ: Theta", "✵: Starburst"];
const vectorCore = ["ϟ: Koppa", "χ: Chi", "∑.1: Sigma 1", "Δ.2: Delta 2", "Ω.2: Omega 2", "✦: Star"];
const threadCore = ["∂: Partial Derivative", "∑.2: Sigma 2", "⊕: Oplus", "φ: Phi", "∞: Infinity", "☷: Earth"];

    // Gather all patterns for each symbol
    const symbolPatterns = {};
    completedEntries.forEach(entry => {
        if (!entry.symbol) return;
        if (!symbolPatterns[entry.symbol]) symbolPatterns[entry.symbol] = [];
        if (entry.reflectionSummary) symbolPatterns[entry.symbol].push(entry.reflectionSummary);
        if (Array.isArray(entry.deeperReflections)) {
            entry.deeperReflections.forEach(deep => {
                if (deep.summary) symbolPatterns[entry.symbol].push(deep.summary);
            });
        }
    });

    // Helper to render a core section
function renderCoreSection(title, symbols) {
    let html = `<div style="margin:1.3em 0 0.7em 0;font-size:1.12em;font-weight:bold;color:#ffe066;letter-spacing:0.12em;">Ξ${title.toUpperCase()} CORE:</div>`;
    html += `<div style="margin-left:1em;">`;
    symbols.forEach(sym => {
        const patterns = symbolPatterns[sym] || [];
        // Try to find the title for this symbol from all prompts
        // Use allPrompts if you set it globally, or combine available + completed
        const allPromptsArr = availablePrompts.concat(completedEntries.map(e => ({
            symbol: e.symbol,
            title: e.title
        })));
        const foundPrompt = allPromptsArr.find(obj => obj.symbol === sym);
        const titleText = foundPrompt ? foundPrompt.title : '';
        html += `<div style="margin-bottom:0.18em;">
            <span style="font-weight:bold;color:var(--channel-color);font-size:1.25em;">${sym}</span>
            ${titleText ? `<span style="color:#ffe066;font-weight:normal;font-size:0.98em;margin-left:0.55em;">${titleText}</span>` : ''}
            ${patterns.length ? patterns.map(p => `<span style="background:rgba(255,255,255,0.08);border-radius:6px;padding:0.13em 0.5em;margin-right:0.13em;">${p}</span>`).join('') : '<span style="color:#888;font-style:italic;">[no patterns yet]</span>'}
        </div>`;
    });
    html += `</div>`;
    return html;
}

    // Build modal content
    let html = `<h3>Your Core Pattern Map</h3>
    <div style="color:#ffe066;margin-bottom:1.5em;font-size:1.07em;">All patterns you've named, organized by core & symbol.</div>`;
    html += renderCoreSection("Identity", identityCore);
    html += renderCoreSection("Vector", vectorCore);
    html += renderCoreSection("Thread", threadCore);

    // Show or create modal
    let triadModal = document.getElementById('triad-summary-modal');
    if (!triadModal) {
        triadModal = document.createElement('div');
        triadModal.id = 'triad-summary-modal';
        triadModal.className = 'modal-overlay';
        triadModal.innerHTML = `
            <div class="modal-content" style="max-width:900px;">
                <div id="triad-summary-content"></div>
                <button class="choice-button" onclick="document.getElementById('triad-summary-modal').classList.remove('visible')">Close</button>
            </div>
        `;
        document.body.appendChild(triadModal);
    }
    triadModal.querySelector('#triad-summary-content').innerHTML = html;
    triadModal.classList.add('visible');
    document.body.classList.add('modal-open');
    // Remove modal-open class on close
    triadModal.querySelector('button').onclick = function() {
        triadModal.classList.remove('visible');
        document.body.classList.remove('modal-open');
    }
}

// function to show the initiative modal
function showInitiativePrompt(entry) {
    hideAllModals(); // Ensure other modals are hidden
    initiativeModal.classList.add('visible');
    currentInitiativeEntry = entry; // Store the entry we are working on

    initiativePromptText.innerHTML = `<strong>Symbol: ${entry.symbol || ''}</strong><br><br>Open up your journal to where you wrote about <strong>"${entry.summary}"</strong> on ${new Date(entry.completedAt).toLocaleDateString()}. The pattern you spotted was <strong>"${entry.reflectionSummary}"</strong>.<br><br>
	1. In your journal, write how that pattern or cycle is working out for you in real life, AND <br>
	2. Write in your journal what you should do to align this pattern with the future you want. <br>
	3. Based on what you wrote, is this a pattern or cycle one that you should:`;
}



// New helper function to save the initiative and handle state
function saveInitiative(initiativeIcon, initiativeReason) {
  if (currentInitiativeEntry && currentInitiativeDeeperIndex !== null) {
      const deeper = currentInitiativeEntry.deeperReflections[currentInitiativeDeeperIndex];
      if (deeper) {
          deeper.initiative = initiativeIcon;
          deeper.initiativeReason = initiativeReason;
          localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
      }
      currentInitiativeEntry = null;
      currentInitiativeDeeperIndex = null;
  } else if (currentInitiativeEntry) {
      const originalEntry = completedEntries.find(entry => entry.id === currentInitiativeEntry.id);
      if (originalEntry) {
          originalEntry.initiative = initiativeIcon;
          originalEntry.initiativeReason = initiativeReason;
          localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
      }
      currentInitiativeEntry = null;
  }
  hideAllModals();
  if (availablePrompts.length > 0) {
      displayPrompt(availablePrompts[currentPromptIndex]);
  } else {
      displayPrompt(null);
  }
}


function upgradeCompletedEntries() {
    completedEntries.forEach(entry => {
        if (entry.progressAccountedAt === undefined) entry.progressAccountedAt = null;
        if (entry.progressInitiative === undefined) entry.progressInitiative = null;
        if (entry.progressReflection === undefined) entry.progressReflection = null;
        if (entry.deeperReflections === undefined) entry.deeperReflections = [];
		if (entry.initiativeReason === undefined) entry.initiativeReason = null;
		if (entry.deeperReflections) {
 		 entry.deeperReflections.forEach(deep => {
   	    if (deep.initiativeReason === undefined) deep.initiativeReason = null;
		  });
		}
    });
}



function findEntriesDueForProgressAccount() {
    return completedEntries.filter(entry =>
        entry.reflectionSummary &&
        entry.initiative &&
        !entry.progressAccountedAt
    );
}



function showProgressAccountModal(entry) {
    currentProgressAccountEntry = entry;
    const dateStr = new Date(entry.reflectionCompletedAt).toLocaleDateString();
    progressAccountPrompt.innerHTML = `
        <strong>Symbol: ${entry.symbol || ''}</strong><br><br>
        Open your journal to where you wrote about <strong>${entry.summary}</strong> on <strong>${dateStr}</strong>.<br>
        The pattern you spotted was <strong>${entry.reflectionSummary}</strong>, which you chose to <strong>${entry.initiative}</strong>.<br>
        1. IN YOUR JOURNAL, write <strong>WHAT ACTION YOU'VE TAKEN</strong> since then to achieve the initiative to <strong>${entry.initiative}</strong>, could you do better? <br>
        2. Summarize those actions in one line below. <br>
        3. Then choose if those actions are <strong>ACTUALLY HELPING YOU to Maintain, Evolve, or Disrupt:</strong>
    `;
    progressAccountInput.value = "";
    hideAllModals();
    progressAccountModal.classList.add('visible');
    setTimeout(() => {
    progressAccountInput.focus();
    progressAccountInput.select();
    }, 80);
}

function saveProgressAccountWithValidation(initiativeIcon) {
    const value = progressAccountInput.value.trim();
    if (!value) {
        progressAccountModal.classList.remove('visible');
        progressAccountErrorModal.classList.add('visible');
        return;
    }
    saveProgressAccount(initiativeIcon);
}



function saveProgressAccount(initiativeIcon) {
    if (currentProgressAccountEntry && currentProgressAccountDeeperIndex !== null) {
        // Save for deeper reflection
        const deeper = currentProgressAccountEntry.deeperReflections[currentProgressAccountDeeperIndex];
        if (deeper) {
            deeper.progressAccountedAt = new Date().toISOString();
            deeper.progressReflection = progressAccountInput.value;
            deeper.progressInitiative = initiativeIcon;
            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
        }
        currentProgressAccountEntry = null;
        currentProgressAccountDeeperIndex = null;
    } else if (currentProgressAccountEntry) {
        // Top-level entry
        currentProgressAccountEntry.progressAccountedAt = new Date().toISOString();
        currentProgressAccountEntry.progressReflection = progressAccountInput.value;
        currentProgressAccountEntry.progressInitiative = initiativeIcon;
        localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
        currentProgressAccountEntry = null;
		updateArcTrophyCount();
		showArcTrophyCount();
		showAlignmentRating();
		checkAndAwardCoreTrophies();
		updateStreak();
		incrementActivityCount('Took Accountability');
    }
    hideAllModals();
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
}



function findEntriesDueForDeeperInsight() {
    return completedEntries.filter(entry =>
        entry.reflectionSummary &&
        entry.initiative &&
        entry.progressAccountedAt && // Only arcs with a trophy (AFP done)
        (entry.deeperReflections.length === 0)
    );
}



function showDeeperInsightModal(entry) {
    currentDeeperInsightEntry = entry;
    deeperInsightPrompt.innerHTML = `
	  <strong>Symbol: ${entry.symbol || ''}</strong><br><br>
	  Open your journal to where you wrote about <strong>${entry.summary}</strong> on <strong>${new Date(entry.completedAt).toLocaleDateString()}</strong>.<br>
      The previous pattern you spotted was "<strong>${entry.reflectionSummary}</strong>".<br>
      1. Read your entry again, what <strong>OTHER pattern</strong> do you see in your decisions and behavior?<br> 
	  2. Write that pattern down in your journal in the same section if there's room, but a new page somewhere else is fine just copy the header.<br>
      3. Summarize what you just wrote in your journal into one line and enter that one line summary below:
    `;
    deeperInsightInput.value = "";
    hideAllModals();
    deeperInsightModal.classList.add('visible');
    deeperInsightInput.focus();
}


function showInitiativePromptForReflection(parentEntry, deeperIndex) {
    hideAllModals();
    initiativeModal.classList.add('visible');
    currentInitiativeEntry = parentEntry;
    currentInitiativeDeeperIndex = deeperIndex;

    const deeper = parentEntry.deeperReflections[deeperIndex];

    initiativePromptText.innerHTML = `<strong>Symbol: ${parentEntry.symbol || ''}</strong><br><br>Open your journal to where you wrote about "<strong>${parentEntry.summary}</strong>" on <strong>${new Date(parentEntry.completedAt).toLocaleDateString()}</strong>.<br>
    The deeper pattern you spotted was "<strong>${deeper.summary}</strong>".<br><br>
    1. In your journal, write about how that pattern or cycle is working out for you in real life. <br>
	2. Based on what you wrote, is this a pattern or cycle one that you should:`;

}

function showInitiativeReasonInput() {
  document.getElementById('initiative-buttons-container').style.display = 'none';
  document.getElementById('initiative-reason-section').style.display = 'block';
  document.getElementById('initiative-reason-input').value = "";
  document.getElementById('initiative-reason-input').focus();
}


function showProgressAccountModalForReflection(parentEntry, deeperIndex) {
    if (
        !parentEntry ||
        !Array.isArray(parentEntry.deeperReflections) ||
        parentEntry.deeperReflections.length <= deeperIndex ||
        deeperIndex == null
    ) {
        // Fallback: do nothing, or show an error, or call regular modal for parent
        alert("Sorry, could not find the deeper reflection for this item.");
        return;
    }
    hideAllModals();
    currentProgressAccountEntry = parentEntry;
    currentProgressAccountDeeperIndex = deeperIndex;

    const deeper = parentEntry.deeperReflections[deeperIndex];
    const dateStr = new Date(parentEntry.completedAt).toLocaleDateString();

      progressAccountPrompt.innerHTML = `
	  <strong>Symbol: ${parentEntry.symbol || ''}</strong><br><br>
	  Open your journal to where you wrote about <strong>${parentEntry.summary}</strong> on <strong>${dateStr}</strong>.<br>
      The pattern at work that you spotted was "<strong>${deeper.summary}</strong>", which you chose to <strong>${deeper.initiative}</strong>.<br>
      In your journal, write <strong>WHAT ACTION YOU'VE TAKEN</strong> since then to achieve your initiative– or how you could do better.<br>
      Then summarize your actions below and choose if those actions <strong>actually aligned</strong> with your intent to Maintain, Evolve, Or Disrupt:
    `;
    progressAccountInput.value = "";
    progressAccountModal.classList.add('visible');
    progressAccountInput.focus();
	setTimeout(() => {
   	 progressAccountInput.focus();
   	 progressAccountInput.select();
	}, 80);
}


function checkShowEvalReminder() {
    // Only show if not already shown
    if (localStorage.getItem('evalReminderShown')) return;

    // Count completed entries (adjust variable name if needed)
    const entryCount = Array.isArray(completedEntries) ? completedEntries.length : 0;

    if (entryCount === 8) {
        showEvalReminderModal();
        localStorage.setItem('evalReminderShown', 'true');
    }
}

function showEvalReminderModal() {
    let modal = document.getElementById('eval-reminder-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'eval-reminder-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px;">
                <div style="font-size:2.5em; margin-bottom:1em;">🏆</div>
                <h3>Check Your Progress!</h3>
                <p>You've made awesome progress—8 entries complete!<br><br>
                Try the <b>Evaluation</b> button (<span style="font-size:1.2em;">🏆</span>) to see your patterns, trophies, and stats so far.</p>
                <button id="close-eval-reminder-modal" class="choice-button">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-eval-reminder-modal').onclick = function() {
            modal.classList.remove('visible');
        };
    }
    modal.classList.add('visible');
}


function showTrophyModal(label, description) {
    let modal = document.getElementById('trophy-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'trophy-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px;">
                <div id="trophy-emoji" style="font-size:3em; margin-bottom:1em;">🏆</div>
                <h3 id="trophy-label"></h3>
                <p id="trophy-desc"></p>
                <button id="close-trophy-modal" class="choice-button">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-trophy-modal').onclick = function() {
            modal.classList.remove('visible');
        };
    }
    document.getElementById('trophy-label').innerText = label;
    document.getElementById('trophy-desc').innerText = description;
    modal.classList.add('visible');
}


// 1. Data Backup Export (as .rjbak)
function exportDataBackup() {
    // Gather all relevant app state
    const data = {
        completedEntries: typeof completedEntries !== 'undefined' ? completedEntries : [],
        trophies: typeof trophies !== 'undefined' ? trophies : [],
        currentStreak: localStorage.getItem('currentStreak') || 0,
        longestStreak: localStorage.getItem('longestStreak') || 0,
        // Add any additional keys you want to preserve here
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const filename = `recursive-journal-backup-${(new Date()).toISOString().slice(0,10)}.rjbak`;
    triggerDownload(blob, filename);
}

// 2. Data Backup Import (from .rjbak)
function importDataBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rjbak,application/json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);

                if (!Array.isArray(data.completedEntries) || !Array.isArray(data.trophies)) {
                    alert("Invalid backup file.");
                    return;
                }

                // Confirm with user
                if (!confirm("Importing a backup will overwrite your current journal data, trophies, and streaks. Proceed?")) return;

                // Restore state
                window.completedEntries = data.completedEntries;
                window.trophies = data.trophies;
                localStorage.setItem('currentStreak', data.currentStreak || "0");
                localStorage.setItem('longestStreak', data.longestStreak || "0");

                // Save trophies if needed
                if (typeof saveTrophies !== 'undefined') saveTrophies();

                // Save entries if you have a function for that
                if (typeof saveEntries !== 'undefined') saveEntries();

                alert("Backup imported! Please reload the page to finish restoring your data.");
            } catch (err) {
                alert("Failed to import backup: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}


function formatEntryForTxt(entry, isDeeper = false, index = null) {
    let out = '';
    const prefix = isDeeper ? `  [Deeper Insight #${index + 1}]\n` : '';
    out += `${prefix}Symbol: ${entry.symbol || ''}\nEntry Topic: ${entry.summary || ''}\n`;
    out += `Pattern Found: ${entry.reflectionSummary || entry.summary || ''}\n`;
    out += `Choice Made: ${entry.initiative || ''}\n`;
    out += `Action Taken: ${entry.progressReflection || ''}\n`;
    out += `Initiative Reason: ${entry.initiativeReason || ''}\n`;
    out += `Results Seen: ${entry.progressInitiative || ''}\n`;
    out += `Entry Recorded: ${entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : ''}\n`;
    out += `Progress Evaluated: ${entry.progressAccountedAt ? new Date(entry.progressAccountedAt).toLocaleDateString() : ''}\n`;
    out += '\n';
    return out;
}

function exportTableOfContents() {
    let txt = '';
    txt += '=== Recursive Journal Table of Contents ===\n';
    txt += `Exported: ${(new Date()).toLocaleString()}\n\n`;

    // Entries
    txt += '--- Entries ---\n';
    (completedEntries || []).forEach((entry, idx) => {
        txt += `[Entry #${idx + 1}]\n`;
        txt += formatEntryForTxt(entry, false, idx);

        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach((deep, dIdx) => {
                txt += formatEntryForTxt(deep, true, dIdx);
            });
        }
        txt += '-----------------------\n';
    });
    if (!completedEntries || completedEntries.length === 0) txt += 'No entries yet.\n';

// TRIAD SUMMARY SECTION
// Define cores
const identityCore = ["Δ.1: Delta 1", "Ω.1: Omega 1", "Ψ: Psi", "Λ: Lambda", "Θ: Theta", "✵: Starburst"];
const vectorCore = ["ϟ: Koppa", "χ: Chi", "∑.1: Sigma 1", "Δ.2: Delta 2", "Ω.2: Omega 2", "✦: Star"];
const threadCore = ["∂: Partial Derivative", "∑.2: Sigma 2", "⊕: Oplus", "φ: Phi", "∞: Infinity", "☷: Earth"];

// Gather all patterns for each symbol
const symbolPatterns = {};
(completedEntries || []).forEach(entry => {
    if (!entry.symbol) return;
    if (!symbolPatterns[entry.symbol]) symbolPatterns[entry.symbol] = [];
    if (entry.reflectionSummary) symbolPatterns[entry.symbol].push(entry.reflectionSummary);
    if (Array.isArray(entry.deeperReflections)) {
        entry.deeperReflections.forEach(deep => {
            if (deep.summary) symbolPatterns[entry.symbol].push(deep.summary);
        });
    }
});

// Gather all prompts (assuming they're loaded and available globally as allPrompts)
function findTitleForSymbol(sym) {
    // You can use allPrompts, or combine availablePrompts and completedEntries
    // If you have allPrompts, prefer using just that:
    if (typeof allPrompts !== 'undefined' && allPrompts) {
        const found = allPrompts.find(p => p.symbol === sym);
        return found ? found.title : '';
    }
    // Fallback: search availablePrompts and completedEntries for title
    const arrs = [];
    if (typeof availablePrompts !== 'undefined' && availablePrompts) arrs.push(...availablePrompts);
    if (typeof completedEntries !== 'undefined' && completedEntries) arrs.push(...completedEntries);
    const found = arrs.find(p => p.symbol === sym && p.title);
    return found ? found.title : '';
}

function renderCoreSectionTxt(title, symbols) {
    let out = `Ξ${title.toUpperCase()} CORE:\n`;
    symbols.forEach(sym => {
        const patterns = symbolPatterns[sym] || [];
        const titleText = findTitleForSymbol(sym);
        out += `  ${sym}`;
        if (titleText) out += ` - ${titleText}`;
        out += ' - ';
        if (patterns.length) {
            out += patterns.join('; ');
        } else {
            out += '[no patterns yet]';
        }
        out += '\n';
    });
    return out + '\n';
}

txt += '--- TRIAD SUMMARY ---\n\n';
txt += renderCoreSectionTxt("Identity", identityCore);
txt += renderCoreSectionTxt("Vector", vectorCore);
txt += renderCoreSectionTxt("Thread", threadCore);

// Stats
	if (typeof buildStats === 'function') {
    	const stats = buildStats();
	    txt += '--- Stats ---\n';
	    txt += `Days Since First Entry: ${stats.daysSinceFirstEntry}\n`;
		txt += `Days Since Last Active: ${stats.daysSinceLastActive}\n`;
	    txt += `Main Entries Written: ${stats.totalActivities}\n`;
	    txt += `Total Activities Completed: ${stats.activityCount}\n`;
		txt += `Awards Earned: ${stats.awardsEarned}\n`;
	    txt += `Current Streak: ${stats.streak} days\n`;
	    txt += `Longest Streak: ${stats.longestStreak} days\n`;
		txt += `Longest Inactive Streak: ${stats.longestInactive} days\n`;
	    txt += `Completed Arc Trophies: ${stats.arcTrophies}\n`;
	    txt += `Alignment: ${stats.alignment}%\n\n`;
		txt += `Score: ${stats.score}\n`;
}

    // Trophies
    txt += '--- Trophies ---\n';
    (trophies || []).forEach((t, idx) => {
        txt += `${idx + 1}. ${t.label} (${t.description}) [${t.earnedAt ? new Date(t.earnedAt).toLocaleDateString() : ''}]\n`;
    });
    if (!trophies || trophies.length === 0) txt += 'No trophies yet.\n';
    txt += '\n';

    // Save
    const filename = `journal-table-of-contents-${(new Date()).toISOString().slice(0,10)}.txt`;
    triggerDownload(new Blob([txt], { type: "text/plain" }), filename);
	checkArchivistTrophy()
}

// --- Download Helper ---
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function checkEvaluationGlow() {
    const evalBtn = document.getElementById('evaluation-button');
    if (!evalBtn) return;
    // Always glow if there are 8 or more entries
    if (completedEntries.length >= 8) {
        evalBtn.classList.add('glow');
    } else {
        evalBtn.classList.remove('glow');
    }
}

// Award streak trophies (call after updating streak)
function checkAndAwardStreakTrophies(currentStreak, longestStreak) {
    // --- Weekly trophies (7, 14, 21, ...) repeatable ---
    if (currentStreak % 7 === 0 && currentStreak > 0) {
        // Use a unique ID for each week (date + streak)
        awardTrophy({
            id: `weekly-streak-${currentStreak}-${new Date().toISOString().slice(0,10)}`,
            type: 'weekly-streak',
            label: `🏆 Journaled ${currentStreak} days in a row!`,
            description: `You journaled ${currentStreak} consecutive days. Keep it going!`,
            relatedData: {streak: currentStreak}
        });
    }

    // Monthly trophies (30, 60, 90, ..., 365)
    const months = [
        {days: 30, label: "Best month ever!", text: "Journaled 30 consecutive days"},
        {days: 60, label: "A second month of success!", text: "Journaled 60 consecutive days"},
        {days: 90, label: "Third Month, what a charm!", text: "Journaled daily for 3 months"},
        {days: 120, label: "Four months of great habits!", text: "Journaled daily for 4 months"},
        {days: 150, label: "Five months unfazed, great work!", text: "Journaled daily for 5 months"},
        {days: 180, label: "AMAZING WORK! You've written in your journal every day for half of the year!", text: "Journaled daily for 6 months"},
        {days: 210, label: "Seventh Heaven, seven months of hard work!", text: "Journaled Daily for 7 months"},
        {days: 240, label: "Many moons behind you. Eight months of daily journaling, well done!", text: "Journaled daily 8 months"},
        {days: 270, label: "Nine Months of Mastery! You've made daily journaling an unshakable part of your life.", text: "Journaled daily for 9 months"},
        {days: 300, label: "Ten Months Strong! You've gone above and beyond to build this incredible habit.", text: "Journaled daily for 10 months"},
        {days: 330, label: "Closing in on a Full Year! Your consistency and dedication are truly inspiring.", text: "Journaled daily for 11 months"},
        {days: 365, label: "A Full Year of YOU! Congratulations on writing in your journal every single day for one full year. You've built an incredible legacy of self-reflection and growth. This is a monumental achievement, well done!", text: "JOURNALED DAILY FOR ONE YEAR"}
    ];
    for (const m of months) {
        // Only award monthly milestone if not already earned
        if (currentStreak === m.days && !trophies.some(t => t.id === `month-streak-${m.days}`)) {
            awardTrophy({
                id: `month-streak-${m.days}`,
                type: 'month-streak',
                label: `🏆 ${m.text}`,
                description: m.label,
                relatedData: {streak: m.days}
            });
        }
    }
    // Consistency trophy: beat previous streak after reset
    const lastBroken = parseInt(localStorage.getItem('lastBrokenLongestStreak') || "0", 10);
    // Has to be a real comeback: lastBroken must be > 0, and currentStreak just passed it
    if (
        lastBroken > 0 &&
        currentStreak === lastBroken + 1 &&
        !trophies.some(t => t.type === 'consistency' && t.relatedData && t.relatedData.longestStreakBroken == lastBroken)
    ) {
        awardTrophy({
            id: `consistency-${currentStreak}`,
            type: 'consistency',
            label: "🏆 Don't Call it a Comeback!",
            description: "Your journaling consistency IMPROVED! Previous streak just beaten!",
            relatedData: {streak: currentStreak, longestStreakBroken: lastBroken}
        });
    }
}

function updateStreak() {
    const todayStr = getTodayString();
    let currentStreak = parseInt(localStorage.getItem('currentStreak') || "0", 10);
    let lastActiveDate = localStorage.getItem('lastActiveDate');
    let longestStreak = parseInt(localStorage.getItem('longestStreak') || "0", 10);

    if (!lastActiveDate) {
        // First ever entry
        currentStreak = 1;
    } else {
        const last = new Date(lastActiveDate);
        const today = new Date(todayStr);
        const diffDays = Math.floor((today - last) / (24 * 60 * 60 * 1000));

        if (diffDays === 1) {
            // Consecutive day
            currentStreak += 1;
        } else if (diffDays > 1) {
            // Missed a day, reset and award broken streak trophy
            localStorage.setItem('lastBrokenLongestStreak', String(longestStreak));
            awardBrokenStreakTrophy(longestStreak, currentStreak);
			tryRestoreStreakWithTripleCrown(currentStreak);
            currentStreak = 1;
        }
        // else: same day, do nothing
    }
    // --- AWARD TROPHIES BEFORE updating longestStreak ---
    checkAndAwardStreakTrophies(currentStreak, longestStreak);

    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
    }

    localStorage.setItem('currentStreak', String(currentStreak));
    localStorage.setItem('lastActiveDate', todayStr);
    localStorage.setItem('longestStreak', String(longestStreak));
}

// --- CORE TROPHY LOGIC ---

// Symbol sets for each core
const identityCore = ["Δ.1: Delta 1", "Ω.1: Omega 1", "Ψ: Psi", "Λ: Lambda", "Θ: Theta", "✵: Starburst"];
const vectorCore = ["ϟ: Koppa", "χ: Chi", "∑.1: Sigma 1", "Δ.2: Delta 2", "Ω.2: Omega 2", "✦: Star"];
const threadCore = ["∂: Partial Derivative", "∑.2: Sigma 2", "⊕: Oplus", "φ: Phi", "∞: Infinity", "☷: Earth"];



// Check for core completion trophies (call after arc completion)
function checkAndAwardCoreTrophies() {
    // Helper to check if each symbol has a completed arc
    function hasAllSymbols(symbols) {
        return symbols.every(sym =>
            completedEntries.some(entry => entry.symbol === sym && entry.progressAccountedAt)
        );
    }

    if (hasAllSymbols(identityCore)) {
        awardTrophy({
            id: "core-identity",
            type: "core",
            label: "🏆 Completed Identity Core: Δ.1, Ω.1, Ψ, Λ, Θ, ✵",
            description: "You've completed the Identity Core. The patterns represented by these symbols combine to express your inner self and perceived self: Δ.1, Ω.1, Ψ, Λ, Θ, ✵",
            relatedData: {core: "identity", symbols: identityCore}
        });
    }
    if (hasAllSymbols(vectorCore)) {
        awardTrophy({
            id: "core-vector",
            type: "core",
            label: "🏆 Completed Vector Core: ϟ, χ, ∑.1, Δ.2, Ω.2, ✦",
            description: "You've completed the Vector Core. The patterns represented by these symbols combine to express your trajectory of growth and purpose: ϟ, χ, ∑.1, Δ.2, Ω.2, ✦",
            relatedData: {core: "vector", symbols: vectorCore}
        });
    }
    if (hasAllSymbols(threadCore)) {
        awardTrophy({
            id: "core-thread",
            type: "core",
            label: "🏆 Completed Thread Core: ∂, ∑.2, ⊕, φ, ∞, ☷",
            description: "You've completed the Thread Core. The patterns represented by these symbols combine to express your means of persistence over time: ∂, ∑.2, ⊕, φ, ∞, ☷",
            relatedData: {core: "thread", symbols: threadCore}
        });
    }
}



function awardTrophy({id, type, label, description, relatedData}) {
    if (trophies.some(t => t.id === id)) return;
    trophies.push({
        id,
        type,
        earnedAt: new Date().toISOString(),
        label,
        description,
        relatedData: relatedData || null
    });
    saveTrophies();
    showTrophyModal(label, description);
}


function getTodayString() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "YYYY-MM-DD"
}


function checkDoubleDipTrophy() {
    // List of all activities (could use a new array if you want, but here: completedEntries + reflection + deeper + initiatives + progress)
    const today = getTodayString();
    // Gather all activity timestamps (main entries, reflections, initiatives, progress accounts, deeper insights)
    let todayCount = 0;
    completedEntries.forEach(entry => {
        if (entry.completedAt && entry.completedAt.slice(0,10) === today) todayCount++;
        if (entry.reflectionCompletedAt && entry.reflectionCompletedAt.slice(0,10) === today) todayCount++;
        if (entry.progressAccountedAt && entry.progressAccountedAt.slice(0,10) === today) todayCount++;
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach(deep => {
                if (deep.completedAt && deep.completedAt.slice(0,10) === today) todayCount++;
                if (deep.progressAccountedAt && deep.progressAccountedAt.slice(0,10) === today) todayCount++;
            });
        }
    });
    // Only award if 2+ activities today and not already awarded for today
    if (todayCount >= 2 && !trophies.some(t => t.id === "double-dip-" + today)) {
        awardTrophy({
            id: "double-dip-" + today,
            type: "double-dip",
            label: "🥤 Double Dip!",
            description: "You completed more than one activity today. That's dedication!",
            relatedData: {date: today}
        });
    }
}

function checkTripleCrownTrophy() {
    const today = getTodayString();
    let todayCount = 0;
    completedEntries.forEach(entry => {
        if (entry.completedAt && entry.completedAt.slice(0,10) === today) todayCount++;
        if (entry.reflectionCompletedAt && entry.reflectionCompletedAt.slice(0,10) === today) todayCount++;
        if (entry.progressAccountedAt && entry.progressAccountedAt.slice(0,10) === today) todayCount++;
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach(deep => {
                if (deep.completedAt && deep.completedAt.slice(0,10) === today) todayCount++;
                if (deep.progressAccountedAt && deep.progressAccountedAt.slice(0,10) === today) todayCount++;
            });
        }
    });
    if (todayCount === 3 && !trophies.some(t => t.id === `triple-crown-${today}`)) {
        awardTrophy({
            id: `triple-crown-${today}`,
            type: 'triple-crown',
            label: "👑 Triple Crown!",
            description: "You completed three different activities today! That's mastery in action.",
            relatedData: {date: today}
        });
    }
}

function tryRestoreStreakWithTripleCrown(previousStreak) {
    // Find triple crown trophies
    const tripleCrowns = trophies.filter(t => t.type === 'triple-crown');
    if (tripleCrowns.length > 0) {
        if (confirm("You have a Triple Crown! Would you like to cash it in to restore your streak?")) {
            // Remove one Triple Crown trophy
            const tcId = tripleCrowns[0].id;
            trophies = trophies.filter(t => t.id !== tcId);
            saveTrophies();
            // Optionally remove Broken Streak trophy as well
            trophies = trophies.filter(t => t.type !== 'broken-streak');
            saveTrophies();
            // Restore streak to previous value
            localStorage.setItem('currentStreak', String(previousStreak));
            showStreakInHeader();
            alert(`Streak restored to ${previousStreak} days!`);
        }
    }
}

function checkMetaMindTrophy() {
    const count = completedEntries.filter(entry => entry.deeperReflections && entry.deeperReflections.length > 0).length;
    if (count >= 3 && !trophies.some(t => t.id === "meta-mind")) {
        awardTrophy({
            id: "meta-mind",
            type: "meta-mind",
            label: "🧠 Meta Mind",
            description: "You've completed deeper insights for 3 different main entries. You're going deeper!",
            relatedData: {count}
        });
    }
}

function checkArcMasterTrophy() {
    const count = getArcCompletionCount();
    if (count >= 10 && !trophies.some(t => t.id === "arc-master")) {
        awardTrophy({
            id: "arc-master",
            type: "arc-master",
            label: "🏆 Arc Master",
            description: "You've completed 10 arcs (entry, reflection, initiative, progress). Legendary!",
            relatedData: {count}
        });
    }
}

function checkArchivistTrophy() {
    if (!trophies.some(t => t.id === "archivist")) {
        awardTrophy({
            id: "archivist",
            type: "archivist",
            label: "🗃 Archivist",
            description: "You exported your journal as a TXT file. You're keeping your story safe!",
            relatedData: {}
        });
    }
}

function getWeekYear(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    const yearStart = new Date(d.getFullYear(),0,1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return {year: d.getFullYear(), week: weekNo};
}

function checkWeeklyWarriorTrophy() {
    // Build a set of week-year pairs from all activity dates
    const weekSet = new Set();
    completedEntries.forEach(entry => {
        if (entry.completedAt) weekSet.add(JSON.stringify(getWeekYear(entry.completedAt)));
        if (entry.reflectionCompletedAt) weekSet.add(JSON.stringify(getWeekYear(entry.reflectionCompletedAt)));
        if (entry.progressAccountedAt) weekSet.add(JSON.stringify(getWeekYear(entry.progressAccountedAt)));
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach(deep => {
                if (deep.completedAt) weekSet.add(JSON.stringify(getWeekYear(deep.completedAt)));
                if (deep.progressAccountedAt) weekSet.add(JSON.stringify(getWeekYear(deep.progressAccountedAt)));
            });
        }
    });
    // Sort week-year pairs
    let weeks = Array.from(weekSet).map(w => JSON.parse(w));
    weeks.sort((a, b) => a.year !== b.year ? a.year - b.year : a.week - b.week);
    // Check for 4 consecutive
    for (let i = 0; i <= weeks.length - 4; i++) {
        let ok = true;
        for (let j = 1; j < 4; j++) {
            let prev = weeks[i+j-1], cur = weeks[i+j];
            let expected = {year: prev.year, week: prev.week+1};
            if (expected.week > 52) { expected.week = 1; expected.year++; }
            if (cur.year !== expected.year || cur.week !== expected.week) { ok = false; break; }
        }
        if (ok && !trophies.some(t => t.id === "weekly-warrior-" + weeks[i+3].year + "-" + weeks[i+3].week)) {
            awardTrophy({
                id: "weekly-warrior-" + weeks[i+3].year + "-" + weeks[i+3].week,
                type: "weekly-warrior",
                label: "📅 Weekly Warrior",
                description: "You completed at least one activity every week for four consecutive weeks. Consistency is power!",
                relatedData: {weeks: weeks.slice(i,i+4)}
            });
            break;
        }
    }
}


function checkAllAnglesTrophy() {
    const today = new Date();
    // Get the current week/year
    const {year, week} = getWeekYear(today.toISOString().slice(0,10));
    const weekYearId = `${year}-W${week}`;
    let typesDone = new Set();
    // Check for the current week (all 7 days prior including today)
    for (let d = 0; d < 7; d++) {
        const date = new Date(today.getTime() - d*24*60*60*1000);
        const dayStr = date.toISOString().slice(0,10);
        completedEntries.forEach(entry => {
            if (entry.completedAt && entry.completedAt.slice(0,10) === dayStr) typesDone.add("main");
            if (entry.reflectionCompletedAt && entry.reflectionCompletedAt.slice(0,10) === dayStr) typesDone.add("reflection");
            if (entry.initiative && entry.reflectionCompletedAt && entry.reflectionCompletedAt.slice(0,10) === dayStr) typesDone.add("initiative");
            if (entry.progressAccountedAt && entry.progressAccountedAt.slice(0,10) === dayStr) typesDone.add("progress");
            if (entry.deeperReflections && entry.deeperReflections.length > 0) {
                entry.deeperReflections.forEach(deep => {
                    if (deep.completedAt && deep.completedAt.slice(0,10) === dayStr) typesDone.add("reflection");
                    if (deep.initiative && deep.completedAt && deep.completedAt.slice(0,10) === dayStr) typesDone.add("initiative");
                    if (deep.progressAccountedAt && deep.progressAccountedAt.slice(0,10) === dayStr) typesDone.add("progress");
                });
            }
        });
    }
    if (
        ["main","reflection","initiative","progress"].every(t => typesDone.has(t)) &&
        !trophies.some(t => t.id === "all-angles-" + weekYearId)
    ) {
        awardTrophy({
            id: "all-angles-" + weekYearId,
            type: "all-angles",
            label: "📐 All Angles Inc. Baby!",
            description: "In one week, you completed every type of activity (main, reflection, initiative, progress). True versatility!",
            relatedData: {week: weekYearId}
        });
    }
}

function awardBrokenStreakTrophy(longestStreak, currentStreak) {
    const today = getTodayString();
    if (!trophies.some(t => t.id === `broken-streak-${today}`)) {
        awardTrophy({
            id: `broken-streak-${today}`,
            type: 'broken-streak',
            label: "🍂 Streak Broken",
            description: `It's alright, you can beat that score again! Your previous best was ${longestStreak} days.`,
            relatedData: {brokenAt: today, longestStreak}
        });
    }
}






function showStreakInHeader() {
    const streak = localStorage.getItem('currentStreak') || 0;
    const longest = localStorage.getItem('longestStreak') || 0;
    const streakDiv = document.getElementById('streak-counter');
    if (streakDiv) {
        streakDiv.innerHTML = `🔥 Streak: ${streak} days (Longest: ${longest})`;
    }
}


function getArcCompletionCount() {
    // Count all top-level and deeper arcs that are complete (have progressAccountedAt)
    let count = 0;
    completedEntries.forEach(entry => {
        if (entry.progressAccountedAt) count++;
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach(deep => {
                if (deep.progressAccountedAt) count++;
            });
        }
    });
    return count;
}

function updateArcTrophyCount() {
    const count = getArcCompletionCount();
    localStorage.setItem('arcTrophyCount', String(count));
	checkArcMasterTrophy();
}

function showArcTrophyCount() {
    const count = localStorage.getItem('arcTrophyCount') || 0;
    const trophyDiv = document.getElementById('arc-trophy-counter');
    if (trophyDiv) {
        trophyDiv.innerHTML = `🏆 Completed Arc Trophies: ${count}`;
    }

    let lastShown = parseInt(localStorage.getItem('lastArcTrophyCountShown') || "0", 10);
    if (parseInt(count, 10) > lastShown) {
        // Standard celebration
        if (window.confetti) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            // Extra flair for multiples of 5
            if (parseInt(count, 10) % 5 === 0) {
                setTimeout(() => {
                    confetti({
                        particleCount: 400,
                        spread: 120,
                        origin: { y: 0.5 },
                        colors: ['#ffe066', '#ff80bf', '#80ffea', '#baff80']
                    });
                }, 600);
            }
        }
        localStorage.setItem('lastArcTrophyCountShown', String(count));
    }
}

function saveTrophies() {
    localStorage.setItem(TROPHY_STORAGE_KEY, JSON.stringify(trophies));
}



function getAlignmentStats() {
    let total = 0, aligned = 0;
    completedEntries.forEach(entry => {
        // Top-level
        if (entry.initiative && entry.progressInitiative) {
            total++;
            if (entry.initiative === entry.progressInitiative) aligned++;
        }
        // Deeper reflections
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach(deep => {
                if (deep.initiative && deep.progressInitiative) {
                    total++;
                    if (deep.initiative === deep.progressInitiative) aligned++;
                }
            });
        }
    });
    return {
        total,
        aligned,
        percent: total > 0 ? Math.round((aligned / total) * 100) : 0
    };
}

function showAlignmentRating() {
    const stats = getAlignmentStats();
    const alignDiv = document.getElementById('alignment-rating');
    if (alignDiv) {
        alignDiv.innerHTML = `✨ Alignment: ${stats.aligned} / ${stats.total} (${stats.percent}%)`;
    }
}


// --- TRIAD SUMMARY STRUCTURE ---

function buildTriadSummary() {
    const summary = {
        identity: {},
        vector: {},
        thread: {}
    };
    // Helper to map symbol to core
    function coreOfSymbol(symbol) {
        if (identityCore.includes(symbol)) return "identity";
        if (vectorCore.includes(symbol)) return "vector";
        if (threadCore.includes(symbol)) return "thread";
        return null;
    }
    // Gather all patterns for each symbol
    completedEntries.forEach(entry => {
        if (!entry.symbol || !entry.progressAccountedAt) return; // Only completed arcs
        const core = coreOfSymbol(entry.symbol);
        if (!core) return;
        if (!summary[core][entry.symbol]) summary[core][entry.symbol] = [];
        if (entry.reflectionSummary) {
            summary[core][entry.symbol].push(entry.reflectionSummary);
        }
        // Also include deeperReflections (if desired: if you want only top-level, omit this block)
        if (entry.deeperReflections && Array.isArray(entry.deeperReflections)) {
            entry.deeperReflections.forEach(deep => {
                if (deep.summary) summary[core][entry.symbol].push(deep.summary);
            });
        }
    });
    // Fill in missing symbols with empty arrays
    for (const sym of identityCore) if (!summary.identity[sym]) summary.identity[sym] = [];
    for (const sym of vectorCore) if (!summary.vector[sym]) summary.vector[sym] = [];
    for (const sym of threadCore) if (!summary.thread[sym]) summary.thread[sym] = [];
    return summary;
}


// --- STATS STRUCTURE ---
function buildStats() {
    const streak = parseInt(localStorage.getItem('currentStreak') || "0", 10);
    const longestStreak = parseInt(localStorage.getItem('longestStreak') || "0", 10);
    const arcTrophies = typeof getArcCompletionCount === 'function' ? getArcCompletionCount() : 0;
    const alignmentStats = typeof getAlignmentStats === 'function' ? getAlignmentStats() : { percent: 0 };
    const alignment = alignmentStats.percent || 0;
    const totalActivities = Array.isArray(completedEntries) ? completedEntries.length : 0;
    const activityCount = parseInt(localStorage.getItem('activityCount') || "0", 10);

    // Awards earned (trophies)
    let awardsEarned = 0;
    try {
        const trophiesRaw = localStorage.getItem('trophies');
        if (trophiesRaw) {
            const trophiesArr = JSON.parse(trophiesRaw);
            awardsEarned = Array.isArray(trophiesArr) ? trophiesArr.length : 0;
        }
    } catch (e) {
        awardsEarned = 0;
    }

    // Days since first entry
    let daysSinceFirstEntry = 0;
    if (Array.isArray(completedEntries) && completedEntries.length > 0) {
        const first = new Date(completedEntries[0].completedAt);
        const today = new Date();
        daysSinceFirstEntry = Math.floor((today - first) / (24 * 60 * 60 * 1000)) + 1;
    }

    // Days since last active
    let daysSinceLastActive = 0;
    const lastActive = localStorage.getItem('lastActiveDate');
    if (lastActive) {
        const last = new Date(lastActive);
        const now = new Date();
        daysSinceLastActive = Math.floor((now - last) / (24 * 60 * 60 * 1000));
    }

    // Longest inactive streak
    const longestInactive = parseInt(localStorage.getItem('longestInactive') || "0", 10);

    // Score (somewhat arbitrary)
    let score = 0;
    score += activityCount * 10;
    score += totalActivities * 5;
    score += awardsEarned * 10;
    score += arcTrophies * 20;
    score += streak * 2;
    if (alignment > 60) score += (alignment - 60);

    return {
        streak,
        longestStreak,
        arcTrophies,
        alignment,
        totalActivities,
        activityCount,
        awardsEarned,
        daysSinceFirstEntry,
        daysSinceLastActive,
        longestInactive,
        score
    };
}


function updateInactivityStats() {
    const now = new Date();
    const lastActive = localStorage.getItem('lastActiveDate');
    if (lastActive) {
        const last = new Date(lastActive);
        const gap = Math.floor((now - last) / (24 * 60 * 60 * 1000));
        let longest = parseInt(localStorage.getItem('longestInactive') || "0", 10);
        if (gap > longest) {
            localStorage.setItem('longestInactive', gap);
        }
    }
    localStorage.setItem('lastActiveDate', now.toISOString());
}



function maybeShowWelcomeModal() {
    const hideWelcome = localStorage.getItem('hideWelcomeModal');
    const modal = document.getElementById('welcome-modal');
    if (!hideWelcome && modal) {
        // Always start on step 1
        document.getElementById('welcome-step-1').style.display = '';
        document.getElementById('welcome-step-2').style.display = 'none';
        modal.classList.add('visible');
    }
}


// Call this helper after *any* activity is completed (main entry, reflection, initiative, etc.)
function incrementActivityCount(reason = "") {
    activityCount++;
    localStorage.setItem('activityCount', activityCount);
    checkAndAwardActivityTrophies(activityCount, reason);
	checkDoubleDipTrophy();
	checkTripleCrownTrophy();
	checkMetaMindTrophy();
	checkAllAnglesTrophy();
	checkWeeklyWarriorTrophy();
}


function checkAndAwardActivityTrophies(count, reason) {
    if (count === 1) {
        awardTrophy({
            id: `activity-count-1`,
            type: 'activity-count',
            label: `🌱 First Step!`,
            description: `You completed your very first activity. The journey begins!` + (reason ? `\n\nLast Activity: ${reason}` : ''),
            relatedData: {activityCount: count}
        });
    } else if (count === 3) {
        awardTrophy({
            id: `activity-count-3`,
            type: 'activity-count',
            label: `🚀 Three Activities!`,
            description: `You're off to a great start with 3 activities completed. Keep growing!` + (reason ? `\n\nLast Activity: ${reason}` : ''),
            relatedData: {activityCount: count}
        });
    } else if (count > 0 && count % 5 === 0) {
        awardTrophy({
            id: `activity-count-${count}`,
            type: 'activity-count',
            label: `🏅 ${count} Activities Completed!`,
            description: `You've completed ${count} activities. Keep it up!` + (reason ? `\n\nLast Activity: ${reason}` : ''),
            relatedData: {activityCount: count}
        });
    }
}

function findEvaluationsDue() {
    return completedEntries.filter(entry => entry.reflectionSummary !== null && entry.initiative === undefined);
}

function findNextInitiativeDue() {
    return completedEntries.find(entry => entry.reflectionSummary !== null && entry.initiative === undefined);
}


function openModal(modalId) {
  document.getElementById(modalId).classList.add('visible');
  document.body.classList.add('modal-open');
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('visible');
  document.body.classList.remove('modal-open');
}



// Helper function to hide all modals.
function hideAllModals() {
    summaryModal.classList.remove('visible');
    reflectionModal.classList.remove('visible');
    evaluationModal.classList.remove('visible');
    initiativeModal.classList.remove('visible');
    progressAccountModal.classList.remove('visible'); 
	deeperInsightModal.classList.remove('visible');
	document.body.classList.remove('modal-open');
}








// Event listeners for main buttons
nextButton.addEventListener('click', () => {
    if (availablePrompts.length > 0) {
        currentPromptIndex = (currentPromptIndex + 1) % availablePrompts.length;
        displayPrompt(availablePrompts[currentPromptIndex]);
    }
});

prevButton.addEventListener('click', () => {
    if (availablePrompts.length > 0) {
        currentPromptIndex = (currentPromptIndex - 1 + availablePrompts.length) % availablePrompts.length;
        displayPrompt(availablePrompts[currentPromptIndex]);
    }
});

// Event listener for the "Complete Entry" button
completeButton.addEventListener('click', () => {
    if (availablePrompts.length > 0) {
        showSummaryModal();
    } else {
        alert("There are no prompts to complete at this time.");
    }
});


document.getElementById('welcome-next').addEventListener('click', () => {
    document.getElementById('welcome-step-1').style.display = 'none';
    document.getElementById('welcome-step-2').style.display = '';
});

document.getElementById('close-welcome-modal').addEventListener('click', () => {
    const checkbox = document.getElementById('hide-welcome-checkbox');
    if (checkbox.checked) {
        localStorage.setItem('hideWelcomeModal', 'true');
    }
    document.getElementById('welcome-modal').classList.remove('visible');
});

// Event listener for the "Save" button in the summary modal (cheat code enabled)
saveSummaryButton.addEventListener('click', () => {
    const summary = summaryInput.value.trim();

	// Cheat code for auto arc
    if (summary.startsWith('!autofinisharc')) {
        // Find the prompt we're about to save
        const currentPrompt = availablePrompts[currentPromptIndex];
        if (currentPrompt) {
            // Simulate a completed arc instantly
            const now = new Date().toISOString();
            const entry = {
                id: currentPrompt.id,
                symbol: currentPrompt.symbol,
                title: currentPrompt.title,
                summary: summary,
                completedAt: now,
                reflectionSummary: "[auto] Pattern for " + currentPrompt.symbol,
                initiative: "☯️", // can be random or rotating
                initiativeReason: "[auto] Test reason",
                reflectionCompletedAt: now,
                progressAccountedAt: now,
                progressReflection: "[auto] Test action taken",
                progressInitiative: "☯️"
            };
            completedEntries.push(entry);
            completedPrompts.push(currentPrompt.id);
            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
            localStorage.setItem('completedPrompts', JSON.stringify(completedPrompts));
            entryCount++;
            localStorage.setItem('entryCount', entryCount);
            // update streak, trophies, etc
            updateStreak && updateStreak();
            checkAndAwardCoreTrophies && checkAndAwardCoreTrophies();
            checkAndAwardStreakTrophies &&
                checkAndAwardStreakTrophies(
                    parseInt(localStorage.getItem('currentStreak') || "0", 10),
                    parseInt(localStorage.getItem('longestStreak') || "0", 10)
                );
            showStreakInHeader && showStreakInHeader();
            showArcTrophyCount && showArcTrophyCount();
            showAlignmentRating && showAlignmentRating();
            // Remove prompt and refresh UI
            availablePrompts = availablePrompts.filter(p => p.id !== currentPrompt.id);
            hideAllModals && hideAllModals();
            if (availablePrompts.length > 0) {
                if (currentPromptIndex >= availablePrompts.length) currentPromptIndex = 0;
                displayPrompt(availablePrompts[currentPromptIndex]);
            } else {
                displayPrompt(null);
            }
            alert("Auto-arc completed for testing!");
            return;
        }
    }
	// Delimiter of cheat code

     if (summary) {
        const currentPrompt = availablePrompts[currentPromptIndex];
        if (currentPrompt) {
            saveEntry(currentPrompt, summary);
            hideAllModals();

            // Remove completed prompt
            const completedId = currentPrompt.id;
            availablePrompts = availablePrompts.filter(prompt => prompt.id !== completedId);

            // Always advance the prompt, regardless of reflectionIsDue
            if (availablePrompts.length > 0) {
                if (currentPromptIndex >= availablePrompts.length) {
                    currentPromptIndex = 0;
                }
                displayPrompt(availablePrompts[currentPromptIndex]);
            } else {
                displayPrompt(null);
            }


        }
    } else {
        alert("Summary cannot be empty.");
    }
});

// Event listener for the "Cancel" button in the summary modal
cancelSummaryButton.addEventListener('click', () => {
    const summaryValue = summaryInput.value.trim();
    if (summaryValue === '!loveyatomorrow') {
        window.cheatAdvanceStreak && window.cheatAdvanceStreak(1);
        alert("Streak advanced by one day! (cheat code)");
        summaryInput.value = "";
    }
    hideAllModals();
});

// Add event listeners for the reflection buttons
prevReflectionButton.addEventListener('click', () => {
    currentReflectionIndex = (currentReflectionIndex - 1 + availableReflections.length) % availableReflections.length;
    displayReflectionPrompt(availableReflections[currentReflectionIndex]);
});

nextReflectionButton.addEventListener('click', () => {
    currentReflectionIndex = (currentReflectionIndex + 1) % availableReflections.length;
    displayReflectionPrompt(availableReflections[currentReflectionIndex]);
});


completeReflectionButton.addEventListener('click', () => {
    const entryToUpdate = availableReflections[currentReflectionIndex];
    showReflectionInputModal(entryToUpdate, function(reflectionSummary) {
        const originalEntry = completedEntries.find(entry => entry.id === entryToUpdate.id);
        if (originalEntry) {
            originalEntry.reflectionSummary = reflectionSummary;
            originalEntry.reflectionCompletedAt = new Date().toISOString();
            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
            updateStreak();
            showStreakInHeader();
            incrementActivityCount('Found Pattern Through Reflection');
            if (!hasCompletedFirstReflection) {
                hasCompletedFirstReflection = true;
                localStorage.setItem('hasCompletedFirstReflection', 'true');
            }
            const evaluationsDue = findEvaluationsDue();
            if (evaluationsDue.length >= 3) {
                evaluationIsDue = true;
                localStorage.setItem('evaluationIsDue', 'true');
            }
            hideAllModals();
            if (availablePrompts.length > 0) {
                displayPrompt(availablePrompts[currentPromptIndex]);
            } else {
                displayPrompt(null);
            }
        }
    });
});

const cancelReflectionPatternButton = document.getElementById('cancel-reflection-pattern');
if (cancelReflectionPatternButton) {
    cancelReflectionPatternButton.addEventListener('click', () => {
        reflectionInputModal.classList.remove('visible');
        // Optionally, return to the summary/reflection modal if you want:
        if (reflectionModal) reflectionModal.classList.add('visible');
    });
}

// Event listener for the "Close" button in the evaluation modal
closeEvaluationButton.addEventListener('click', () => {
    hideAllModals();
    
    // Check if there are still prompts left to display
    if (availablePrompts.length > 0) {
        // Adjust the index to ensure it's still within the bounds of the new array
        if (currentPromptIndex >= availablePrompts.length) {
            currentPromptIndex = 0;
        }
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        // Handle the case where all prompts are completed
        displayPrompt(null);
    }
});


// Event listeners for the initiative buttons
maintainButton.addEventListener('click', () => {
  pendingInitiativeIcon = '☯️ Maintain';
  showInitiativeReasonInput();
});
evolveButton.addEventListener('click', () => {
  pendingInitiativeIcon = '🌿 Evolve';
  showInitiativeReasonInput();
});
disruptButton.addEventListener('click', () => {
  pendingInitiativeIcon = '❌ Disrupt';
  showInitiativeReasonInput();
});
cancelInitiativeButton.addEventListener('click', () => {
    console.log('Cancel initiative clicked');
    hideAllModals();
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
});



progressMaintainBtn.addEventListener('click', () => saveProgressAccountWithValidation('☯️ Maintain'));
progressEvolveBtn.addEventListener('click', () => saveProgressAccountWithValidation('🌿 Evolve'));
progressDisruptBtn.addEventListener('click', () => saveProgressAccountWithValidation('❌ Disrupt'));
progressAccountCancelBtn.addEventListener('click', () => {
    hideAllModals();
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
});


saveDeeperInsightButton.addEventListener('click', () => {
    const newPattern = deeperInsightInput.value.trim();
    if (newPattern && currentDeeperInsightEntry) {
        currentDeeperInsightEntry.deeperReflections.push({
            summary: newPattern,
            completedAt: new Date().toISOString(),
            initiative: null,
            reflectionSummary: null,
            progressAccountedAt: null,
            progressReflection: null,
            progressInitiative: null
        });
        localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
        updateStreak();
        showStreakInHeader();
		incrementActivityCount('Seeking Deeper Insight');
        hideAllModals();
        // Always return to the main menu after one deeper insight activity
        if (availablePrompts.length > 0) {
            displayPrompt(availablePrompts[currentPromptIndex]);
        } else {
            displayPrompt(null);
        }
    } else {
        alert("Please enter a new pattern summary.");
    }
});


cancelDeeperInsightButton.addEventListener('click', () => {
    hideAllModals();
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
});



saveTxtFileButton.addEventListener('click', () => {
    const txt = exportTableOfContents();
    if (txt.trim().length === 0) {
        alert("No entries to save yet!");
        return;
    }
    downloadTxtFile(txt, 'journal_entries.txt');
});

document.getElementById('save-initiative-reason').addEventListener('click', () => {
  const reason = document.getElementById('initiative-reason-input').value.trim();
  if (!reason) {
    alert("Please enter your reasoning before saving.");
    return;
  }
  saveInitiative(pendingInitiativeIcon, reason);
  updateStreak();
  incrementActivityCount('Took Initiative');
  // Reset UI for next time
  document.getElementById('initiative-buttons-container').style.display = 'flex';
  document.getElementById('initiative-reason-section').style.display = 'none';
  pendingInitiativeIcon = null;
});

document.getElementById('export-backup-btn').onclick = exportDataBackup;
document.getElementById('import-backup-btn').onclick = importDataBackup;


document.getElementById('connect-social-btn').addEventListener('click', () => {
    document.getElementById('social-modal').classList.add('visible');
});
document.getElementById('close-social-modal').addEventListener('click', () => {
    document.getElementById('social-modal').classList.remove('visible');
});


// Support Modal functionality
document.getElementById('support-btn').addEventListener('click', () => {
    document.getElementById('support-modal').classList.add('visible');
});
document.getElementById('close-support-modal').addEventListener('click', () => {
    document.getElementById('support-modal').classList.remove('visible');
});


// Coaching Modal functionality
document.getElementById('coaching-btn').addEventListener('click', () => {
    document.getElementById('coaching-modal').classList.add('visible');
});
document.getElementById('close-coaching-modal').addEventListener('click', () => {
    document.getElementById('coaching-modal').classList.remove('visible');
});


// Event listener for the new evaluation button on the main page
evaluationButton.addEventListener('click', () => {
    showEvaluationModal();
});

document.getElementById('evaluation-button').addEventListener('click', function() {
    localStorage.setItem('evaluationGlowDismissed', 'true');
    this.classList.remove('glow');
    // ...show your modal logic here
});



// Initial function call to start the app
loadDataAndPrompts();
updateStreak();
showStreakInHeader();
showArcTrophyCount();
showAlignmentRating();
checkEvaluationGlow();
maybeShowWelcomeModal();





// Add at the bottom of app.js, after other code
let touchStartY = 0;
let isPulling = false;
const pullThreshold = window.innerHeight * 0.4; // 40% of viewport height

// Create a spinner element if it doesn't already exist
let refreshSpinner = document.getElementById('refresh-spinner');
if (!refreshSpinner) {
  refreshSpinner = document.createElement('div');
  refreshSpinner.id = 'refresh-spinner';
  refreshSpinner.style.display = 'none';
  refreshSpinner.style.position = 'fixed';
  refreshSpinner.style.top = '20px';
  refreshSpinner.style.left = '50%';
  refreshSpinner.style.transform = 'translateX(-50%)';
  refreshSpinner.style.zIndex = '9999';
  refreshSpinner.style.padding = '0.5em 1em';
  refreshSpinner.style.background = 'rgba(30,30,40,0.85)';
  refreshSpinner.style.borderRadius = '12px';
  refreshSpinner.style.fontSize = '1.2em';
  refreshSpinner.style.color = '#99ffcc';
  refreshSpinner.style.transition = 'top 0.2s';
  refreshSpinner.innerHTML = '⟳ Refreshing...';
  document.body.appendChild(refreshSpinner);
}

window.addEventListener('touchstart', function(e) {
  if (document.body.classList.contains('modal-open')) return;
  if (window.scrollY === 0) {
    touchStartY = e.touches[0].clientY;
    isPulling = true;
    refreshSpinner.style.display = 'none';
  }
});

window.addEventListener('touchmove', function(e) {
  if (!isPulling || document.body.classList.contains('modal-open')) return;
  const pullDistance = e.touches[0].clientY - touchStartY;
  if (pullDistance > 0) {
    refreshSpinner.style.display = 'block';
    // Animate spinner's vertical position up to 80px as user pulls
    refreshSpinner.style.top = `${20 + Math.min(80, pullDistance / 2)}px`;
  }
});

window.addEventListener('touchend', function(e) {
  if (!isPulling || document.body.classList.contains('modal-open')) return;
  const pullDistance = e.changedTouches[0].clientY - touchStartY;
  if (pullDistance > pullThreshold) {
    refreshSpinner.style.top = '60px';
    refreshSpinner.style.display = 'block';
    setTimeout(() => {
      // NEW: Check for deeper insights due before reload
      let deeperDue = findEntriesDueForDeeperInsight ? findEntriesDueForDeeperInsight() : [];
      if (deeperDue && deeperDue.length > 0) {
        refreshSpinner.style.display = 'none';
        showDeeperInsightModal(deeperDue[0]);
      } else {
        location.reload();
      }
    }, 400); // Show spinner briefly before reload or modal
  } else {
    // Snap spinner back and hide smoothly
    refreshSpinner.style.top = '20px';
    setTimeout(() => {
      refreshSpinner.style.display = 'none';
    }, 200);
  }
  isPulling = false;
});


window.addEventListener('touchcancel', function() {
  refreshSpinner.style.top = '20px';
  refreshSpinner.style.display = 'none';
  isPulling = false;
});

// --- DEBUG ONLY: CHEAT FUNCTION TO ADVANCE STREAK ---
// Call window.cheatAdvanceStreak(days) in the browser console to simulate N days of consecutive activity.
window.cheatAdvanceStreak = function(days = 1) {
    let lastActiveDate = localStorage.getItem('lastActiveDate');
    let currentStreak = parseInt(localStorage.getItem('currentStreak') || "0", 10);
    let longestStreak = parseInt(localStorage.getItem('longestStreak') || "0", 10);
    if (!lastActiveDate) lastActiveDate = new Date().toISOString().slice(0, 10);

    for (let i = 1; i <= days; i++) {
        // Advance date by 1 each loop
        let date = new Date(lastActiveDate);
        date.setDate(date.getDate() + 1);
        let dateStr = date.toISOString().slice(0, 10);
        // Set localStorage as if user journaled on that date
        localStorage.setItem('lastActiveDate', dateStr);
        currentStreak += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        localStorage.setItem('currentStreak', String(currentStreak));
        localStorage.setItem('longestStreak', String(longestStreak));
        // Award any streak trophies as if this were a real entry
        checkAndAwardStreakTrophies(currentStreak, longestStreak);
        lastActiveDate = dateStr;
    }
    alert(`Simulated ${days} streak day(s). Current streak is now ${currentStreak}.`);
    showStreakInHeader && showStreakInHeader();
};



// --- CHEAT: Break the streak instantly (for testing) ---
// Call window.cheatBreakStreak() in browser console
window.cheatBreakStreak = function() {
    localStorage.setItem('currentStreak', '0');
    localStorage.setItem('lastActiveDate', '');
    showStreakInHeader && showStreakInHeader();
    alert('Streak broken! Current streak set to 0.');
};



// Simulate breaking a streak and then building up to beat it
window.cheatSimulateComeback = function(previousLongest = 7, extraDays = 3, delay = 150) {
    // Step 1: Break the streak
    localStorage.setItem('longestStreak', String(previousLongest));
    localStorage.setItem('currentStreak', '0');
    localStorage.setItem('lastActiveDate', '');
    showStreakInHeader && showStreakInHeader();
    alert(`Streak reset. Now simulating comeback to beat previous longest streak of ${previousLongest} days...`);
    // Step 2: Simulate streak rebuild, one day at a time
    let daysToSimulate = previousLongest + extraDays;
    let i = 0;
    function simulateNextDay() {
        i++;
        cheatAdvanceStreak(1); // This should trigger all logic for one day
        if (i < daysToSimulate) {
            setTimeout(simulateNextDay, delay); // Next day
        } else {
            alert(`Simulated ${daysToSimulate} days. Check if comeback trophy fired!`);
        }
    }
    setTimeout(simulateNextDay, delay);
};


});
