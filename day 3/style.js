// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/**
 * 1. searchNotes(word)
 * Returns an array of notes whose text contains word, ignoring upper and lower case.
 */
function searchNotes(word) {
  if (!word) return [];
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

/**
 * 2. longestNote()
 * Returns the note object with the most characters, or null if there are no notes.
 */
function longestNote() {
  if (notes.length === 0) return null;
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  }, notes[0]);
}

/**
 * 3. countByCategory()
 * Returns an object counting notes per category, such as { personal: 2, work: 1, study: 2 }.
 */
function countByCategory() {
  return notes.reduce((acc, note) => {
    acc[note.category] = (acc[note.category] || 0) + 1;
    return acc;
  }, {});
}

/**
 * 4. getSummary()
 * Returns a sentence such as "5 notes: 2 personal, 1 work, 2 study."
 */
function getSummary() {
  const total = notes.length;
  const counts = countByCategory();
  const categoryParts = Object.entries(counts).map(([cat, count]) => `${count} ${cat}`);
  
  if (total === 0) {
    return "0 notes.";
  }
  
  return `${total} notes: ${categoryParts.join(", ")}.`;
}

/**
 * 5. isDuplicate(text)
 * Returns true if a note with the same text already exists (ignoring case and extra spaces).
 */
function isDuplicate(text) {
  if (!text) return false;
  const cleanText = text.trim().replaceAll(/\s+/g, " ").toLowerCase();
  return notes.some(note => {
    const existingCleanText = note.text.trim().replaceAll(/\s+/g, " ").toLowerCase();
    return existingCleanText === cleanText;
  });
}

/**
 * 6. addNote(text, category)
 * Adds a note only if it is 1–200 characters, is not a duplicate,
 * and the category is one of personal, work or study.
 * Returns true when added and false otherwise, logging the reason.
 */
function addNote(text, category) {
  const allowedCategories = ["personal", "work", "study"];

  // Validate text length
  if (!text || text.length < 1 || text.length > 200) {
    console.log(`Failed to add note: Text length must be between 1 and 200 characters. (Got length: ${text ? text.length : 0})`);
    return false;
  }

  // Validate category
  if (!allowedCategories.includes(category)) {
    console.log(`Failed to add note: Invalid category "${category}". Must be one of: ${allowedCategories.join(", ")}.`);
    return false;
  }

  // Check for duplicate
  if (isDuplicate(text)) {
    console.log(`Failed to add note: Duplicate text found -> "${text}".`);
    return false;
  }

  // Generate new ID and create note
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  const newNote = { id: newId, text, category };
  
  notes.push(newNote);
  console.log(`Successfully added note (ID: ${newId}): "${text}" [${category}]`);
  return true;
}


// ==========================================
// TESTING THE FUNCTIONS
// ==========================================

console.log("=== 1. Testing searchNotes() ===");
console.log('searchNotes("day"):', searchNotes("day"));
console.log('searchNotes("MILK"):', searchNotes("MILK"));
console.log('searchNotes("nonexistent"):', searchNotes("nonexistent"));

console.log("\n=== 2. Testing longestNote() ===");
console.log('longestNote():', longestNote());

console.log("\n=== 3. Testing countByCategory() ===");
console.log('countByCategory():', countByCategory());

console.log("\n=== 4. Testing getSummary() ===");
console.log('getSummary():', getSummary());

console.log("\n=== 5. Testing isDuplicate() ===");
console.log('isDuplicate("  Call mum  "):', isDuplicate("  Call mum  ")); // true
console.log('isDuplicate("call   MUM"):', isDuplicate("call   MUM")); // true
console.log('isDuplicate("Go to gym"):', isDuplicate("Go to gym")); // false

console.log("\n=== 6. Testing addNote() ===");

// Test 6a: Valid Note
console.log('Adding valid note:', addNote("Schedule doctor appointment", "personal")); // Should succeed

// Test 6b: Duplicate Note
console.log('Adding duplicate note:', addNote("Call mum", "personal")); // Should fail

// Test 6c: Invalid Category
console.log('Adding invalid category:', addNote("Buy groceries", "shopping")); // Should fail

// Test 6d: Invalid Length (empty)
console.log('Adding empty note:', addNote("", "work")); // Should fail

// Test 6e: Invalid Length (>200 chars)
const longText = "a".repeat(201);
console.log('Adding >200 char note:', addNote(longText, "study")); // Should fail

console.log("\n=== Summary after additions ===");
console.log('getSummary():', getSummary());
console.log('Updated Notes Array:', notes);