// Starting data array
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
// Returns an array of notes whose text contains word, ignoring case.
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

// 2. longestNote()
// Returns the note object with the most characters, or null if empty.
function longestNote() {
  if (notes.length === 0) return null;

  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
// Returns an object counting notes per category.
function countByCategory() {
  let counts = {};
  for (let i = 0; i < notes.length; i++) {
    let cat = notes[i].category;
    if (counts[cat]) {
      counts[cat]++;
    } else {
      counts[cat] = 1;
    }
  }
  return counts;
}

// 4. getSummary()
// Returns a human-readable string summary of the current note metrics.
function getSummary() {
  const total = notes.length;
  const label = total === 1 ? "note" : "notes";
  const counts = countByCategory();

  // Format categorical strings safely even if a category does not exist yet
  const personalCount = counts.personal || 0;
  const workCount = counts.work || 0;
  const studyCount = counts.study || 0;

  return `${total} ${label}: ${personalCount} personal, ${workCount} work, ${studyCount} study.`;
}

// 5. isDuplicate(text)
// Returns true if a note with the same text exists (ignoring case and extra spaces).
function isDuplicate(text) {
  const cleanText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

// 6. addNote(text, category)
// Adds a note only if it passes all validation criteria. Logs reason if rejected.
function addNote(text, category) {
  // Validation 1: Character Length Rules
  if (!text || text.length < 1 || text.length > 200) {
    console.log(`[Rejected] Note text must be between 1 and 200 characters. Provided length: ${text ? text.length : 0}`);
    return false;
  }

  // Validation 2: Allowed Categories
  const allowedCategories = ["personal", "work", "study"];
  if (!allowedCategories.includes(category)) {
    console.log(`[Rejected] Invalid category "${category}". Must be personal, work, or study.`);
    return false;
  }

  // Validation 3: Duplicate Protection
  if (isDuplicate(text)) {
    console.log(`[Rejected] Duplicate text detected: "${text.trim()}"`);
    return false;
  }

  // Create and safely push valid note
  const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: text, category: category });
  return true;
}


/* ==========================================
   🧪 TESTING FUNCTION CONSOLE RUNS
========================================== */

console.log("--- 1. Testing searchNotes ---");
console.log(searchNotes("javascript"));
// Expected: Array with 1 item: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("pineapple"));
// Expected: Empty array []

console.log("\n--- 2. Testing longestNote ---");
console.log(longestNote());
// Expected: Note 3 object: { id: 3, text: "Email the project report to Grace", category: "work" }
// Edge case: temporarily clearing array to check empty status
let originalNotes = [...notes];
notes = [];
console.log(longestNote());
// Expected: null
notes = originalNotes; // Restore data

console.log("\n--- 3. Testing countByCategory ---");
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }
// Edge case: testing with empty tracking context array
notes = [];
console.log(countByCategory());
// Expected: {}
notes = originalNotes; // Restore data

console.log("\n--- 4. Testing getSummary ---");
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."
// Edge case: verifying singular grammar output matching 1 note structural rules
notes = [{ id: 1, text: "Single assignment task", category: "study" }];
console.log(getSummary());
// Expected: "1 note: 0 personal, 0 work, 1 study."
notes = originalNotes; // Restore data

console.log("\n--- 5. Testing isDuplicate ---");
console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true
console.log(isDuplicate("This is completely unique text string"));
// Expected: false

console.log("\n--- 6. Testing addNote ---");
// Success Case
console.log(addNote("Prepare presentation deck", "work"));
// Expected: true (Note gets appended successfully)
// Edge Case A: Length failure validation rule check
console.log(addNote("", "personal"));
// Expected: [Rejected]... printed first, then false
// Edge Case B: Invalid Category option check
console.log(addNote("Play some video games", "leisure"));
// Expected: [Rejected]... printed first, then false
// Edge Case C: Duplicate protection validation check
console.log(addNote("Call mum", "personal"));
// Expected: [Rejected]... printed first, then false
