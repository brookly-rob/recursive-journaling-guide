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


const deeperInsightModal = document.getElementById('deeper-insight-modal');
const deeperInsightPrompt = document.getElementById('deeper-insight-prompt');
const deeperInsightInput = document.getElementById('deeper-insight-input');
const saveDeeperInsightButton = document.getElementById('save-deeper-insight');
const cancelDeeperInsightButton = document.getElementById('cancel-deeper-insight');

const saveTxtFileButton = document.getElementById('save-txt-file');




// Helper function to display a prompt on the page.
function displayPrompt(prompt) {
if (!prompt) {
    // Handle case where all prompts are completed
    promptSymbol.textContent = "";
    promptTitle.textContent = "Today's prompts completed!";
    promptText.textContent = "You can evaluate below, or refresh this page to see if another activity is due!";
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
    
    if (entryCount > 0 && entryCount % 2 === 0) { // Using 2 for testing
        reflectionIsDue = true;
        localStorage.setItem('reflectionIsDue', 'true');
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
        entryCount = parseInt(savedCount, 5);
    }

    const savedReflectionFlag = localStorage.getItem('reflectionIsDue');
    if (savedReflectionFlag === 'true') {
        reflectionIsDue = true;
    }

    const savedFirstReflectionFlag = localStorage.getItem('hasCompletedFirstReflection');
    if (savedFirstReflectionFlag === 'true') {
        hasCompletedFirstReflection = true;
    }

    const entriesForProgressAccount = findEntriesDueForProgressAccount();
    if (entriesForProgressAccount.length >= 5) {
        showProgressAccountModal(entriesForProgressAccount[0]);
        return;
    }


const deeperDue = findEntriesDueForDeeperInsight();
if (availablePrompts.length === 0 && deeperDue.length > 0) {
    showDeeperInsightModal(deeperDue[0]);
    return;
}


    // 2. Load all prompts from the JSON file
    try {
        const response = await fetch('prompts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allPrompts = await response.json();

        // 3. Filter out the completed prompts
        availablePrompts = allPrompts.filter(prompt => !completedPrompts.includes(prompt.id));

        // Now that all data is loaded, check for reflection and evaluation states
        findReflectionsDue();
        const evaluationsDue = findEvaluationsDue();
        const nextInitiative = findNextInitiativeDue();

        // Check for an initiative due first, as it takes precedence over everything else
        if (nextInitiative) {
            showInitiativePrompt(nextInitiative); 
            return;
        }

        // Check for evaluation due next
        if (evaluationIsDue && evaluationsDue.length > 0) {
            showEvaluationModal();
            return;
        }

        // Check for reflection due
        if (reflectionIsDue && availableReflections.length > 0) {
            showReflectionModal();
            return;
        }
        
        // If nothing else is due, display the main prompt
        if (availablePrompts.length > 0) {
            displayPrompt(availablePrompts[currentPromptIndex]);
        } else {
            displayPrompt(null);
        }

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
    summaryInput.focus();
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
    
    reflectionSummaryDisplay.textContent = entry.summary;
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


// Function to show the evaluation modal.
function showEvaluationModal() {
    evaluationModal.classList.add('visible');
    evaluationPrompts.innerHTML = ''; // Clear previous items

    // Gather all reflections (top-level and deeper)
    let allReflections = [];

    completedEntries.forEach(entry => {
        // Top-level reflection
        if (entry.reflectionSummary) {
            allReflections.push({
                symbol: entry.symbol,
                summary: entry.summary,
                completedAt: entry.completedAt,
                reflectionSummary: entry.reflectionSummary,
                initiative: entry.initiative,
                progressAccountedAt: entry.progressAccountedAt,
                progressReflection: entry.progressReflection,
                progressInitiative: entry.progressInitiative,
                isDeeper: false,
                parentEntry: entry,
                deeperIndex: null,
            });
        }
        // Deeper reflections
        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach((deep, dIdx) => {
                allReflections.push({
                    symbol: entry.symbol,
                    summary: entry.summary,
                    completedAt: deep.completedAt,
                    reflectionSummary: deep.summary, // treat 'summary' as the reflection one-liner
                    initiative: deep.initiative,
                    progressAccountedAt: deep.progressAccountedAt,
                    progressReflection: deep.progressReflection,
                    progressInitiative: deep.progressInitiative,
                    isDeeper: true,
                    parentEntry: entry,
                    deeperIndex: dIdx,
                });
            });
        }
    });

    if (allReflections.length === 0) {
        evaluationPrompts.textContent = "You have not completed any reflections yet.";
        return;
    }

    allReflections.forEach((ref, index) => {
        const div = document.createElement('div');
        div.className = 'evaluation-prompt';

        let initiativeIcon = '';
        if (ref.initiative) {
            initiativeIcon = `<span class="initiative-icon">${ref.initiative}</span>`;
            div.classList.add('evaluated');
            if (ref.reflectionSummary && ref.initiative && !ref.progressAccountedAt) {
                div.classList.add('afp-eligible');
            }
        } else {
            div.classList.add('needs-initiative');
        }

        div.innerHTML = `<strong>${ref.symbol}</strong>: "${ref.reflectionSummary}" ${initiativeIcon}` + (ref.isDeeper ? ' <span style="font-size:0.8em;opacity:0.7;">(deeper insight)</span>' : '');

div.addEventListener('click', () => {
    let reflectionObj;
    if (!ref.isDeeper) {
        reflectionObj = ref.parentEntry;
    } else {
        reflectionObj = ref.parentEntry.deeperReflections[ref.deeperIndex];
    }

    if (reflectionObj.initiative === undefined || reflectionObj.initiative === null) {
        if (ref.isDeeper) {
            showInitiativePromptForReflection(ref.parentEntry, ref.deeperIndex);
        } else {
            showInitiativePrompt(ref.parentEntry);
        }
    } else if (
        ref.reflectionSummary &&
        reflectionObj.initiative &&
        !reflectionObj.progressAccountedAt
    ) {
        if (ref.isDeeper) {
            showProgressAccountModalForReflection(ref.parentEntry, ref.deeperIndex);
        } else {
            showProgressAccountModal(ref.parentEntry);
        }
    } else {
        let msg = `Summary: ${ref.summary}
Pattern Found: ${ref.reflectionSummary}
Initiative Taken: ${reflectionObj.initiative} (${reflectionObj.progressInitiative ? `then chose ${reflectionObj.progressInitiative} when Accounting for Progress` : ''})
Actions Taken: ${reflectionObj.progressReflection ? reflectionObj.progressReflection : 'N/A'}
Entry Recorded: ${reflectionObj.completedAt ? new Date(reflectionObj.completedAt).toLocaleDateString() : 'N/A'}
Progress Accounted At: ${reflectionObj.progressAccountedAt ? new Date(reflectionObj.progressAccountedAt).toLocaleDateString() : 'N/A'}
`;
        alert(msg);
    }
});
        evaluationPrompts.appendChild(div);
    });
}


// New function to show the initiative modal
function showInitiativePrompt(entry) {
    hideAllModals(); // Ensure other modals are hidden
    currentInitiativeEntry = entry; // Store the entry we are working on

    initiativePromptText.innerHTML = `Open up your journal to where you wrote about "${entry.summary}" on ${new Date(entry.completedAt).toLocaleDateString()}. The pattern you spotted was "${entry.reflectionSummary}".<br><br>In your journal, write about how that pattern or cycle is working out for you in real life, AND what you should do to align this pattern with the future you want. Based on what you wrote, is this a pattern or cycle that you should:`;

    initiativeModal.classList.add('visible');
}



// New helper function to save the initiative and handle state
function saveInitiative(initiativeIcon) {
    if (currentInitiativeEntry && currentInitiativeDeeperIndex !== null) {
        // Save for deeper reflection
        const deeper = currentInitiativeEntry.deeperReflections[currentInitiativeDeeperIndex];
        if (deeper) {
            deeper.initiative = initiativeIcon;
            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));
        }
        // Reset state
        currentInitiativeEntry = null;
        currentInitiativeDeeperIndex = null;
    } else if (currentInitiativeEntry) {
        // Top-level
        const originalEntry = completedEntries.find(entry => entry.id === currentInitiativeEntry.id);
        if (originalEntry) {
            originalEntry.initiative = initiativeIcon;
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
      Open your journal to where you wrote about <strong>${entry.summary}</strong> on <strong>${dateStr}</strong>.<br>
      The pattern you spotted was <strong>${entry.reflectionSummary}</strong>, which you chose to <strong>${entry.initiative}</strong>.<br>
      In your journal, write what action you've taken since then to achieve your initiative, or how you could do better. <br>
      Then summarize your progress below:
    `;
    progressAccountInput.value = "";
    hideAllModals();
    progressAccountModal.classList.add('visible');
    progressAccountInput.focus();
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
        (entry.deeperReflections.length === 0)
    );
}



function showDeeperInsightModal(entry) {
    currentDeeperInsightEntry = entry;
    deeperInsightPrompt.innerHTML = `
      Open your journal to where you wrote about <strong>${entry.summary}</strong> on <strong>${new Date(entry.completedAt).toLocaleDateString()}</strong>.<br>
      The previous pattern you spotted was "<strong>${entry.reflectionSummary}</strong>".<br>
      Read your entry again, this time looking for any other patterns you can see. Write that pattern down in your journal in the same section if there's room.<br>
      Summarize what you just wrote in your journal into one line and enter it below:
    `;
    deeperInsightInput.value = "";
    hideAllModals();
    deeperInsightModal.classList.add('visible');
    deeperInsightInput.focus();
}


function showInitiativePromptForReflection(parentEntry, deeperIndex) {
    hideAllModals();
    currentInitiativeEntry = parentEntry;
    currentInitiativeDeeperIndex = deeperIndex;

    const deeper = parentEntry.deeperReflections[deeperIndex];

    initiativePromptText.innerHTML = `Open your journal to where you wrote about "<strong>${parentEntry.summary}</strong>" on <strong>${new Date(parentEntry.completedAt).toLocaleDateString()}</strong>.<br>
    The deeper pattern you spotted was "<strong>${deeper.summary}</strong>".<br><br>
    In your journal, write about how that pattern or cycle is working out for you in real life. Then, based on what you wrote, is this a pattern or cycle that you should:`;

    initiativeModal.classList.add('visible');
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
      Open your journal to where you wrote about <strong>${parentEntry.summary}</strong> on <strong>${dateStr}</strong>.<br>
      The pattern at work that you spotted was "<strong>${deeper.summary}</strong>", which you chose to <strong>${deeper.initiative}</strong>.<br>
      In your journal, write what action you've taken since then to achieve your initiative, or how you could do better.<br>
      Then summarize your actions below and choose if those actions aligned with your intent to Maintain, Evolve, Or Disrupt:
    `;
    progressAccountInput.value = "";
    progressAccountModal.classList.add('visible');
    progressAccountInput.focus();
}


function formatEntryForTxt(entry, isDeeper = false, index = null) {
    let out = '';
    const prefix = isDeeper ? `  [Deeper Insight #${index + 1}]\n` : '';
    out += `${prefix}Symbol: ${entry.symbol || ''}\nSummary: ${entry.summary || ''}\n`;
    out += `Reflection: ${entry.reflectionSummary || entry.summary || ''}\n`;
    out += `Initiative: ${entry.initiative || ''}\n`;
    out += `Accountability Choice: ${entry.progressInitiative || ''}\n`;
    out += `Progress Reflection: ${entry.progressReflection || ''}\n`;
    out += `Completed At: ${entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : ''}\n`;
    out += `Progress Accounted At: ${entry.progressAccountedAt ? new Date(entry.progressAccountedAt).toLocaleDateString() : ''}\n`;
    out += '\n';
    return out;
}

function generateAllEntriesText() {
    let txt = '';
    completedEntries.forEach((entry, idx) => {
        txt += `[Entry #${idx + 1}]\n`;
        txt += formatEntryForTxt(entry, false, idx);

        if (entry.deeperReflections && entry.deeperReflections.length > 0) {
            entry.deeperReflections.forEach((deep, dIdx) => {
                txt += formatEntryForTxt(deep, true, dIdx);
            });
        }

        txt += '-----------------------\n';
    });
    return txt;
}

function downloadTxtFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
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




function findEvaluationsDue() {
    return completedEntries.filter(entry => entry.reflectionSummary !== null && entry.initiative === undefined);
}


function findNextInitiativeDue() {
    return completedEntries.find(entry => entry.reflectionSummary !== null && entry.initiative === undefined);
}


// Helper function to hide all modals.
function hideAllModals() {
    summaryModal.classList.remove('visible');
    reflectionModal.classList.remove('visible');
    evaluationModal.classList.remove('visible');
    initiativeModal.classList.remove('visible');
    progressAccountModal.classList.remove('visible'); 
	deeperInsightModal.classList.remove('visible');
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

// Event listener for the "Save" button in the summary modal
saveSummaryButton.addEventListener('click', () => {
    const summary = summaryInput.value.trim();
    if (summary) {
        const currentPrompt = availablePrompts[currentPromptIndex];
        
        if (currentPrompt) {
            saveEntry(currentPrompt, summary);
            hideAllModals();
            
            const completedId = currentPrompt.id;
            availablePrompts = availablePrompts.filter(prompt => prompt.id !== completedId);
            
            console.log("Entry saved:", completedEntries);
            console.log("Current entry count:", entryCount);
            console.log("Completed prompt IDs:", completedPrompts);
            
            // Check for reflection due
            if (reflectionIsDue) {
                // If a reflection is due, don't show the next prompt immediately
                // The reflection modal will be shown on the next app load
            } else {
                if (availablePrompts.length > 0) {
                    if (currentPromptIndex >= availablePrompts.length) {
                        currentPromptIndex = 0;
                    }
                    displayPrompt(availablePrompts[currentPromptIndex]);
                } else {
                    displayPrompt(null);
                }
            }
        }
    } else {
        alert("Summary cannot be empty.");
    }
});

// Event listener for the "Cancel" button in the summary modal
cancelSummaryButton.addEventListener('click', () => {
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
    const reflectionSummary = prompt("Please enter a one-line summary of the pattern you found:");
    if (reflectionSummary) {
        const entryToUpdate = availableReflections[currentReflectionIndex];

        const originalEntry = completedEntries.find(entry => entry.id === entryToUpdate.id);
        if (originalEntry) {
            originalEntry.reflectionSummary = reflectionSummary;
            originalEntry.reflectionCompletedAt = new Date().toISOString();

            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));

            // Set hasCompletedFirstReflection true if not already
            if (!hasCompletedFirstReflection) {
                hasCompletedFirstReflection = true;
                localStorage.setItem('hasCompletedFirstReflection', 'true');
            }

            // Check if it's time to set the evaluation trigger
            const evaluationsDue = findEvaluationsDue();
            if (evaluationsDue.length >= 2) { // Using 2 for testing
                evaluationIsDue = true;
                localStorage.setItem('evaluationIsDue', 'true');
            }

            // Always close modal and go back to main prompt
            hideAllModals();
            if (availablePrompts.length > 0) {
                displayPrompt(availablePrompts[currentPromptIndex]);
            } else {
                displayPrompt(null);
            }
        }
    } else {
        alert("Reflection not completed. You must provide a summary.");
    }
});


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
    console.log('Maintain clicked');
    saveInitiative('☯️');
});
evolveButton.addEventListener('click', () => {
    console.log('Evolve clicked');
    saveInitiative('🌿');
});
disruptButton.addEventListener('click', () => {
    console.log('Disrupt clicked');
    saveInitiative('❌');
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



progressMaintainBtn.addEventListener('click', () => saveProgressAccount('☯️'));
progressEvolveBtn.addEventListener('click', () => saveProgressAccount('🌿'));
progressDisruptBtn.addEventListener('click', () => saveProgressAccount('❌'));
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
        hideAllModals();
        // Always return to the main menu after one deeper insight activity
        displayPrompt(null);
    } else {
        alert("Please enter a new pattern summary.");
    }
});


cancelDeeperInsightButton.addEventListener('click', () => {
    hideAllModals();
    displayPrompt(null);
});


saveTxtFileButton.addEventListener('click', () => {
    const txt = generateAllEntriesText();
    if (txt.trim().length === 0) {
        alert("No entries to save yet!");
        return;
    }
    downloadTxtFile(txt, 'journal_entries.txt');
});


// Event listener for the new evaluation button on the main page
evaluationButton.addEventListener('click', () => {
    showEvaluationModal();
});

// Initial function call to start the app
loadDataAndPrompts();

const entriesForProgressAccount = findEntriesDueForProgressAccount();
if (entriesForProgressAccount.length >= 5) {
    showProgressAccountModal(entriesForProgressAccount[0]);
}
