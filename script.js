// Select all input elements
const incomeInput = document.getElementById("income");
const needsPercentInput = document.getElementById("needsPercent");
const wantsPercentInput = document.getElementById("wantsPercent");
const savingsPercentInput = document.getElementById("savingsPercent");
const needsSpentInput = document.getElementById("needsSpent");
const wantsSpentInput = document.getElementById("wantsSpent");

// Progress bar elements
const needsProgressBar = document.getElementById("needsProgress");
const wantsProgressBar = document.getElementById("wantsProgress");
const savingsProgressBar = document.getElementById("savingsProgress");

// Status elements
const needsStatus = document.getElementById("needsStatus");
const wantsStatus = document.getElementById("wantsStatus");
const savingsStatus = document.getElementById("savingsStatus");
const feedbackMessage = document.getElementById("feedbackMessage");

// Listen for any input changes
document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", updateBudget);
});

function updateBudget() {
  const income = parseFloat(incomeInput.value) || 0;
  const needsPercent = parseFloat(needsPercentInput.value) || 0;
  const wantsPercent = parseFloat(wantsPercentInput.value) || 0;
  const savingsPercent = parseFloat(savingsPercentInput.value) || 0;

  const needsSpent = parseFloat(needsSpentInput.value) || 0;
  const wantsSpent = parseFloat(wantsSpentInput.value) || 0;

  // Target amounts
  const targetNeeds = (needsPercent / 100) * income;
  const targetWants = (wantsPercent / 100) * income;
  const targetSavings = (savingsPercent / 100) * income;

  const actualSavings = income - (needsSpent + wantsSpent);

  // Progress calculations
  const needsProgress = (needsSpent / targetNeeds) * 100;
  const wantsProgress = (wantsSpent / targetWants) * 100;
  const savingsProgress = (actualSavings / targetSavings) * 100;

  // Update progress bars
  needsProgressBar.style.width = `${Math.min(needsProgress, 100)}%`;
  needsProgressBar.textContent = `${Math.round(needsSpent)}`;
  
  wantsProgressBar.style.width = `${Math.min(wantsProgress, 100)}%`;
  wantsProgressBar.textContent = `${Math.round(wantsSpent)}`;
  
  savingsProgressBar.style.width = `${Math.min(savingsProgress, 100)}%`;
  savingsProgressBar.textContent = `${Math.round(actualSavings)}`;

  // Status messages
  needsStatus.textContent = needsSpent > targetNeeds ? "Exceeded target!" : `Target: ₹${targetNeeds}`;
  wantsStatus.textContent = wantsSpent > targetWants ? "Exceeded target!" : `Target: ₹${targetWants}`;
  savingsStatus.textContent = actualSavings < targetSavings 
    ? "Below target!" 
    : `Target: ₹${targetSavings}`;

  // Feedback message
  if (needsSpent > targetNeeds) {
    feedbackMessage.textContent = "You’ve exceeded your Needs budget!";
    feedbackMessage.style.color = "red";
  } else if (wantsSpent > targetWants) {
    feedbackMessage.textContent = "You’ve exceeded your Wants budget!";
    feedbackMessage.style.color = "red";
  } else if (actualSavings < targetSavings) {
    feedbackMessage.textContent = "You’re missing your future proof.";
    feedbackMessage.style.color = "orange";
  } else if (needsSpent < targetNeeds && wantsSpent < targetWants && actualSavings > targetSavings) {
    feedbackMessage.textContent = "Congrats, you’re rocking it!";
    feedbackMessage.style.color = "green";
  } else {
    feedbackMessage.textContent = "";
  }
}

// Initialize with example data
updateBudget();
