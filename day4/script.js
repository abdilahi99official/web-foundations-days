// Select DOM elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Helper function to count words accurately
function countWords(str) {
    const trimmed = str.trim();
    if (trimmed === "") return 0;
    return trimmed.split(/\s+/).length;
}

// Update counters and manage warning/over state classes
function updateCounts() {
    const text = noteText.value;
    const length = text.length;
    const words = countWords(text);

    // Update text strings
    charCount.textContent = `${length} / 200 characters`;
    wordCount.textContent = `${words} words`;

    // Clear previous warning states
    charCount.classList.remove("warning", "over");

    // Apply conditional validation styling
    if (length > 200) {
        charCount.classList.add("over");
    } else if (length > 180) {
        charCount.classList.add("warning");
    }
}

// Save draft state to localStorage
function saveDraft() {
    localStorage.setItem("note-draft", noteText.value);
}

// Clear input, remove draft from storage, and reset counters
function clearNote() {
    noteText.value = "";
    localStorage.removeItem("note-draft");
    updateCounts();
    noteText.focus();
}

// Apply theme choice and update button text
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark");
        themeToggle.textContent = "Dark mode";
        localStorage.setItem("theme", "light");
    }
}

// Initialize page state on load
function init() {
    // Restore draft if available
    const savedDraft = localStorage.getItem("note-draft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Restore theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    // Compute initial counters
    updateCounts();
}

// --- Event Listeners ---

// 1. Live input tracking
noteText.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

// 2. Clear button click handler
clearBtn.addEventListener("click", clearNote);

// 3. Escape key shortcut inside textarea
noteText.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        clearNote();
    }
});

// 4. Theme toggle button click handler
themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark");
    applyTheme(!isCurrentlyDark);
});

// Run initialization
init();
