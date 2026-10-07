document.addEventListener("DOMContentLoaded", () => {
  // DOM Element Selections
  const noteTextarea = document.getElementById("note-text");
  const charCountEl = document.getElementById("char-count");
  const wordCountEl = document.getElementById("word-count");
  const clearBtn = document.getElementById("clear-btn");
  const themeToggleBtn = document.getElementById("theme-toggle");

  const MAX_CHARS = 200;
  const WARNING_THRESHOLD = 180;

  // Initialize theme from localStorage or default to light mode
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggleBtn.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggleBtn.textContent = "Dark mode";
  }

  // Restore draft from localStorage on page load
  const savedDraft = localStorage.getItem("noteDraft");
  if (savedDraft !== null) {
    noteTextarea.value = savedDraft;
  }

  // Helper function to calculate words
  function getWordCount(text) {
    const trimmedText = text.trim();
    if (trimmedText === "") return 0;
    // Split by one or more whitespace characters
    return trimmedText.split(/\s+/).length;
  }

  // Updates character count, word count, warning/over classes, and saves draft
  function updateCountersAndSave() {
    const text = noteTextarea.value;
    const charLength = text.length;
    const wordLength = getWordCount(text);

    // Update counter display texts
    charCountEl.textContent = `${charLength} / ${MAX_CHARS} characters`;
    wordCountEl.textContent = `${wordLength} words`;

    // Handle warning and over classes on the character count element
    charCountEl.classList.remove("warning", "over");
    if (charLength > MAX_CHARS) {
      charCountEl.classList.add("over");
    } else if (charLength > WARNING_THRESHOLD) {
      charCountEl.classList.add("warning");
    }

    // Save draft to localStorage
    localStorage.setItem("noteDraft", text);
  }

  // Helper function to clear textarea, reset counters, and clear localStorage draft
  function clearNote() {
    noteTextarea.value = "";
    localStorage.removeItem("noteDraft");
    updateCountersAndSave();
  }

  // Event Listener: Input event on textarea
  noteTextarea.addEventListener("input", updateCountersAndSave);

  // Event Listener: Keydown event on textarea to catch Escape key
  noteTextarea.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearNote();
    }
  });

  // Event Listener: Clear button click
  clearBtn.addEventListener("click", clearNote);

  // Event Listener: Theme toggle button click
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    if (isDark) {
      themeToggleBtn.textContent = "Light mode";
      localStorage.setItem("theme", "dark");
    } else {
      themeToggleBtn.textContent = "Dark mode";
      localStorage.setItem("theme", "light");
    }
  });

  // Perform initial counter update on load
  updateCountersAndSave();
});