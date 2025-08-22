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

// Helper function to display a prompt on the page.
function displayPrompt(prompt) {
    if (!prompt) {
        // Handle case where all prompts are completed
        promptSymbol.textContent = "";
        promptTitle.textContent = "All prompts completed!";
        promptText.textContent = "You've gone through all the available prompts. Great work!";
        supplementText.textContent = "";
        
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        completeButton.style.display = 'none';
        evaluationButton.style.display = 'none';
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
    summaryModal.classList.add('visible');
    summaryInput.focus();
}

// Helper function to show the reflection modal.
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

    const reflections = completedEntries.filter(entry => entry.reflectionSummary !== null);

    if (reflections.length === 0) {
        evaluationPrompts.textContent = "You have not completed any reflections yet.";
        return;
    }

    reflections.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'evaluation-prompt';
        
        let initiativeIcon = '';
        if (entry.initiative) {
            initiativeIcon = `<span class="initiative-icon">${entry.initiative}</span>`;
            div.classList.add('evaluated'); // Optional class for styling
        } else {
            div.classList.add('needs-initiative'); // Optional class for styling
        }

        div.innerHTML = `<strong>${entry.symbol}</strong>: "${entry.reflectionSummary}" ${initiativeIcon}`;
        
        div.addEventListener('click', () => {
            // Only allow clicking on items that need an initiative
            if (entry.initiative === undefined) {
                showInitiativePrompt(entry);
            } else {
                alert("This reflection has already been evaluated.");
            }
        });
        evaluationPrompts.appendChild(div);
    });
}

// New function to show the initiative modal
let currentInitiativeEntry = null;

function showInitiativePrompt(entry) {
    hideAllModals(); // Ensure other modals are hidden
    currentInitiativeEntry = entry; // Store the entry we are working on

    initiativePromptText.innerHTML = `Open your journal to where you wrote about "${entry.summary}" on ${new Date(entry.completedAt).toLocaleDateString()}. The pattern you spotted was "${entry.reflectionSummary}".<br><br>In your journal, write about how that pattern or cycle is working out for you in real life. Then, based on what you wrote, is this a pattern or cycle that you should:`;

    initiativeModal.classList.add('visible');
}



// New helper function to save the initiative and handle state
function saveInitiative(initiativeIcon) {
    if (currentInitiativeEntry) {
        const originalEntry = completedEntries.find(entry => entry.id === currentInitiativeEntry.id);
        if (originalEntry) {
            originalEntry.initiative = initiativeIcon;
            localStorage.setItem('journalEntries', JSON.stringify(completedEntries));

            const remainingEvaluations = findEvaluationsDue();
            if (remainingEvaluations.length === 0) {
                evaluationIsDue = false;
                localStorage.setItem('evaluationIsDue', 'false');
            }
        }
    }

    hideAllModals();
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
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

            // Check if it's time to set the evaluation trigger
            const evaluationsDue = findEvaluationsDue();
            if (evaluationsDue.length >= 2) { // Using 2 for testing
                evaluationIsDue = true;
                localStorage.setItem('evaluationIsDue', 'true');
            }

            findReflectionsDue();
            if (availableReflections.length > 0) {
                if (currentReflectionIndex >= availableReflections.length) {
                    currentReflectionIndex = 0;
                }
                displayReflectionPrompt(availableReflections[currentReflectionIndex]);
            } else {
                hideAllModals();
                if (availablePrompts.length > 0) {
                    displayPrompt(availablePrompts[currentPromptIndex]);
                } else {
                    displayPrompt(null);
                }
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
maintainButton.addEventListener('click', () => saveInitiative('☯️'));
evolveButton.addEventListener('click', () => saveInitiative('🌿'));
disruptButton.addEventListener('click', () => saveInitiative('❌'));

cancelInitiativeButton.addEventListener('click', () => {
    hideAllModals();
    // Return to the main view without saving
    if (availablePrompts.length > 0) {
        displayPrompt(availablePrompts[currentPromptIndex]);
    } else {
        displayPrompt(null);
    }
});



// Event listener for the new evaluation button on the main page
evaluationButton.addEventListener('click', () => {
    showEvaluationModal();
});

// Initial function call to start the app
loadDataAndPrompts();