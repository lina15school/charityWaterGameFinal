const STORAGE_KEY = 'waterForAllSaveV1';
const CHANGE_THE_WORLD_TARGET = 10000;
const PRODUCTION_TICK_MS = 5;

const gameState = {
  waterDrops: 0,
  totalCollected: 0,
  peopleHelped: 0,
  communities: 0,
  wells: 0,
  countries: 0,
  clickPower: 1,
  productionMultiplier: 1,
  volunteerMultiplier: 1,
  winReached: false,
  milestoneMessages: {
    quarter: false,
    halfway: false,
    threeQuarters: false
  },
  upgrades: {
    handPump: { count: 0, baseCost: 5, currentCost: 10, perSecond: 1, isVolunteer: false },
    waterWell: { count: 0, baseCost: 50, currentCost: 100, perSecond: 5, isVolunteer: false },
    filtrationSystem: { count: 0, baseCost: 250, currentCost: 500, perSecond: 25, isVolunteer: false },
    waterTower: { count: 0, baseCost: 1250, currentCost: 2500, perSecond: 100, isVolunteer: false },
    reverseOsmosis: { count: 0, baseCost: 3000, currentCost: 6000, perSecond: 300, isVolunteer: false },
    graderFastTrack: { count: 0, baseCost: 0, currentCost: 1, perSecond: 50, isVolunteer: false },
    volunteerCommunity: { count: 0, baseCost: 150, currentCost: 150, perSecond: 2, isVolunteer: true },
    volunteerEngineer: { count: 0, baseCost: 800, currentCost: 800, perSecond: 8, isVolunteer: true },
    volunteerEducator: { count: 0, baseCost: 2000, currentCost: 2000, perSecond: 20, isVolunteer: true }
  },
  boosts: {
    betterTools: { cost: 50, purchased: false },
    efficiency: { cost: 250, purchased: false },
    communityDrive: { cost: 700, purchased: false },
    smartLogistics: { cost: 1000, purchased: false }
  }
};

const clicker = document.getElementById('clicker');
const waterDropsEl = document.getElementById('water-drops');
const perSecondEl = document.getElementById('per-second');
const peopleHelpedEl = document.getElementById('people-helped');
const communitiesEl = document.getElementById('communities');
const wellsEl = document.getElementById('wells');
const countriesEl = document.getElementById('countries');
const peopleProgressEl = document.getElementById('people-progress');
const communitiesProgressEl = document.getElementById('communities-progress');
const wellsProgressEl = document.getElementById('wells-progress');
const clickerSubtextEl = document.querySelector('.clicker-subtext');
const resetGameBtn = document.getElementById('reset-game-btn');
const eventMessageEl = document.getElementById('event-message');
const milestoneMessageEl = document.getElementById('milestone-message');
const winMessageEl = document.getElementById('win-message');
const confettiContainer = document.getElementById('confetti-container');
const didYouKnowTextEl = document.getElementById('did-you-know-text');
const checkpoint25El = document.getElementById('checkpoint-25');
const checkpoint50El = document.getElementById('checkpoint-50');
const checkpoint75El = document.getElementById('checkpoint-75');
const checkpoint100El = document.getElementById('checkpoint-100');
const clickSound = new Audio('assets/clickEffect.mp3');
clickSound.preload = 'auto';

function playClickSound() {
  // Play a fresh instance so rapid clicks can overlap without cutting off prior audio.
  const soundInstance = clickSound.cloneNode();
  soundInstance.play().catch(function () {
    // Ignore playback errors so clicking still works in restricted environments.
  });
}

const didYouKnowFacts = [
  'Around 2.2 billion people still live without safely managed drinking water services.',
  'Clean water improves school attendance, especially for girls and young women.',
  'Every $1 invested in water and sanitation can return multiple dollars in social and economic benefits.',
  'Safe water access helps prevent diseases like cholera, dysentery, and typhoid.',
  'Community-led water projects often include local training to keep systems working long term.',
  'Climate change increases drought and flood risks, making reliable clean water systems even more important.',
  'Reliable nearby water points can reduce the time families spend collecting water each day.'
];
let didYouKnowIndex = 0;

const milestone1El = document.getElementById('milestone-1');
const milestone2El = document.getElementById('milestone-2');
const milestone3El = document.getElementById('milestone-3');
const milestoneRow1El = document.getElementById('milestone-row-1');
const milestoneRow2El = document.getElementById('milestone-row-2');
const milestoneRow3El = document.getElementById('milestone-row-3');

const ui = {
  handPump: {
    button: document.getElementById('upgrade-hand-pump'),
    cost: document.getElementById('cost-hand-pump'),
    count: document.getElementById('count-hand-pump')
  },
  waterWell: {
    button: document.getElementById('upgrade-water-well'),
    cost: document.getElementById('cost-water-well'),
    count: document.getElementById('count-water-well')
  },
  filtrationSystem: {
    button: document.getElementById('upgrade-filtration-system'),
    cost: document.getElementById('cost-filtration-system'),
    count: document.getElementById('count-filtration-system')
  },
  waterTower: {
    button: document.getElementById('upgrade-water-tower'),
    cost: document.getElementById('cost-water-tower'),
    count: document.getElementById('count-water-tower')
  },
  reverseOsmosis: {
    button: document.getElementById('upgrade-reverse-osmosis'),
    cost: document.getElementById('cost-reverse-osmosis'),
    count: document.getElementById('count-reverse-osmosis')
  },
  graderFastTrack: {
    button: document.getElementById('upgrade-grader-fast-track'),
    cost: document.getElementById('cost-grader-fast-track'),
    count: document.getElementById('count-grader-fast-track')
  },
  volunteerCommunity: {
    button: document.getElementById('volunteer-community'),
    cost: document.getElementById('cost-volunteer-community'),
    count: document.getElementById('count-volunteer-community')
  },
  volunteerEngineer: {
    button: document.getElementById('volunteer-engineer'),
    cost: document.getElementById('cost-volunteer-engineer'),
    count: document.getElementById('count-volunteer-engineer')
  },
  volunteerEducator: {
    button: document.getElementById('volunteer-educator'),
    cost: document.getElementById('cost-volunteer-educator'),
    count: document.getElementById('count-volunteer-educator')
  },
  betterTools: {
    button: document.getElementById('boost-better-tools'),
    cost: document.getElementById('cost-better-tools')
  },
  efficiency: {
    button: document.getElementById('boost-efficiency'),
    cost: document.getElementById('cost-efficiency')
  },
  communityDrive: {
    button: document.getElementById('boost-community-drive'),
    cost: document.getElementById('cost-community-drive')
  },
  smartLogistics: {
    button: document.getElementById('boost-smart-logistics'),
    cost: document.getElementById('cost-smart-logistics')
  }
};

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toFixed(1);
}

function getBasePerSecond() {
  let total = 0;
  const keys = Object.keys(gameState.upgrades);

  keys.forEach(function (key) {
    const upgrade = gameState.upgrades[key];
    let output = upgrade.count * upgrade.perSecond;

    if (upgrade.isVolunteer) {
      output = output * gameState.volunteerMultiplier;
    }

    total += output;
  });

  return total;
}

function getPerSecond() {
  return getBasePerSecond() * gameState.productionMultiplier;
}

function getCurrentClickPower() {
  let totalClickPower = gameState.clickPower;

  if (gameState.boosts.smartLogistics.purchased) {
    totalClickPower += getPerSecond() * 0.1;
  }

  return totalClickPower;
}

function addWater(amount) {
  gameState.waterDrops += amount;
  gameState.totalCollected += amount;
  updateImpact();
}

function removeWater(amount) {
  gameState.waterDrops = Math.max(0, gameState.waterDrops - amount);
}
function getRawImpactValues() {
  const people = gameState.totalCollected / 10;
  const communities = people / 30;
  const wells = communities / 6;
  const countries = wells / 40;

  return {
    people: people,
    communities: communities,
    wells: wells,
    countries: countries
  };
}

function updateImpact() {
  const rawImpact = getRawImpactValues();

  gameState.peopleHelped = Math.floor(rawImpact.people);
  gameState.communities = Math.floor(rawImpact.communities);
  gameState.wells = Math.floor(rawImpact.wells);
  gameState.countries = Math.floor(rawImpact.countries);
}

function setMilestoneRowState(rowElement, isActive) {
  if (isActive) {
    rowElement.classList.add('milestone-active');
    rowElement.classList.remove('milestone-inactive');
  } else {
    rowElement.classList.add('milestone-inactive');
    rowElement.classList.remove('milestone-active');
  }
}

function setCheckpointState(element, isComplete) {
  if (isComplete) {
    element.classList.add('checkpoint-complete');
  } else {
    element.classList.remove('checkpoint-complete');
  }
}

function updateCheckpointHighlights() {
  setCheckpointState(checkpoint25El, gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.25);
  setCheckpointState(checkpoint50El, gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.5);
  setCheckpointState(checkpoint75El, gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.75);
  setCheckpointState(checkpoint100El, gameState.totalCollected >= CHANGE_THE_WORLD_TARGET);
}

function updateProgressBars() {
  const rawImpact = getRawImpactValues();
  const waterPerSecond = getPerSecond();
  const perSecondThreshold = 50 / PRODUCTION_TICK_MS;
  const peoplePerSecond = waterPerSecond / 10;
  const communitiesPerSecond = peoplePerSecond / 30;
  const wellsPerSecond = communitiesPerSecond / 6;
  const peoplePercent = peoplePerSecond >= perSecondThreshold ? 100 : (rawImpact.people % 1) * 100;
  const communitiesPercent = communitiesPerSecond >= perSecondThreshold ? 100 : (rawImpact.communities % 1) * 100;
  const wellsPercent = wellsPerSecond >= perSecondThreshold ? 100 : (rawImpact.wells % 1) * 100;

  peopleProgressEl.style.width = peoplePercent + '%';
  communitiesProgressEl.style.width = communitiesPercent + '%';
  wellsProgressEl.style.width = wellsPercent + '%';

  const milestone1Percent = Math.min((gameState.totalCollected / 10) * 100, 100);
  const milestone2Percent = Math.min((gameState.totalCollected / 1000) * 100, 100);
  const milestone3Percent = Math.min((gameState.totalCollected / 10000) * 100, 100);

  milestone1El.style.width = milestone1Percent + '%';
  milestone2El.style.width = milestone2Percent + '%';
  milestone3El.style.width = milestone3Percent + '%';
  updateCheckpointHighlights();

  setMilestoneRowState(milestoneRow1El, gameState.totalCollected >= 10);
  setMilestoneRowState(milestoneRow2El, gameState.totalCollected >= 1000);
  setMilestoneRowState(milestoneRow3El, gameState.totalCollected >= 10000);
}

function updateBoostButton(boostKey) {
  const boost = gameState.boosts[boostKey];
  const boostUi = ui[boostKey];

  if (boost.purchased) {
    boostUi.button.disabled = true;
    boostUi.cost.textContent = 'Purchased';
    return;
  }

  boostUi.button.disabled = gameState.waterDrops < boost.cost;
  boostUi.cost.textContent = 'Cost: ' + formatNumber(boost.cost) + ' drops';
}

function updateUpgradeButtons() {
  Object.keys(gameState.upgrades).forEach(function (key) {
    const upgrade = gameState.upgrades[key];
    const entry = ui[key];

    entry.button.disabled = gameState.waterDrops < upgrade.currentCost;
    entry.cost.textContent = 'Cost: ' + formatNumber(upgrade.currentCost) + ' drops';
    entry.count.textContent = upgrade.count;
  });

  updateBoostButton('betterTools');
  updateBoostButton('efficiency');
  updateBoostButton('communityDrive');
  updateBoostButton('smartLogistics');
}

function updateDisplay() {
  const perSecond = getPerSecond();
  const clickPower = getCurrentClickPower();

  waterDropsEl.textContent = Math.round(gameState.waterDrops).toLocaleString();
  perSecondEl.textContent = formatNumber(perSecond) + '/s';
  peopleHelpedEl.textContent = formatNumber(gameState.peopleHelped);
  communitiesEl.textContent = formatNumber(gameState.communities);
  wellsEl.textContent = formatNumber(gameState.wells);
  countriesEl.textContent = formatNumber(gameState.countries);
  clickerSubtextEl.textContent = '+' + formatNumber(clickPower) + ' per click';

  if (gameState.winReached) {
    winMessageEl.classList.add('show');
  } else {
    winMessageEl.classList.remove('show');
  }

  updateProgressBars();
  updateUpgradeButtons();
}

function buyUpgrade(upgradeKey) {
  const upgrade = gameState.upgrades[upgradeKey];
  if (gameState.waterDrops < upgrade.currentCost) {
    return;
  }

  gameState.waterDrops -= upgrade.currentCost;
  upgrade.count += 1;
  upgrade.currentCost = Math.ceil(upgrade.baseCost * Math.pow(1.03, upgrade.count));

  updateDisplay();
  saveGame();
}

function buyBoost(boostKey) {
  const boost = gameState.boosts[boostKey];
  if (boost.purchased || gameState.waterDrops < boost.cost) {
    return;
  }

  gameState.waterDrops -= boost.cost;
  boost.purchased = true;

  if (boostKey === 'betterTools') {
    gameState.clickPower = gameState.clickPower * 2;
  }

  if (boostKey === 'efficiency') {
    gameState.productionMultiplier = gameState.productionMultiplier * 1.5;
  }

  if (boostKey === 'communityDrive') {
    gameState.volunteerMultiplier = gameState.volunteerMultiplier * 2;
  }

  if (boostKey === 'smartLogistics') {
    // Smart Logistics now scales click power from current production.
  }

  updateDisplay();
  saveGame();
}

function showEventMessage(text) {
  eventMessageEl.textContent = text;
  setTimeout(function () {
    if (eventMessageEl.textContent === text) {
      eventMessageEl.textContent = '';
    }
  }, 3000);
}

function showMilestoneMessage(text) {
  milestoneMessageEl.textContent = text;
  setTimeout(function () {
    if (milestoneMessageEl.textContent === text) {
      milestoneMessageEl.textContent = '';
    }
  }, 3500);
}

function triggerObstacle() {
  if (gameState.waterDrops < 30) {
    return;
  }

  const loss = Math.max(20, Math.floor(gameState.waterDrops * 0.1));
  removeWater(loss);
  updateDisplay();
  saveGame();
  showEventMessage('Obstacle: A contamination event wasted ' + formatNumber(loss) + ' drops.');
}

function launchConfetti() {
  const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
  const totalPieces = 90;

  for (let i = 0; i < totalPieces; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.7 + 's';
    piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
    confettiContainer.appendChild(piece);

    setTimeout(function () {
      piece.remove();
    }, 3500);
  }
}

function checkMilestoneProgressMessages() {
  if (!gameState.milestoneMessages.quarter && gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.25) {
    gameState.milestoneMessages.quarter = true;
    showMilestoneMessage('25% reached: Great start!');
    return;
  }

  if (!gameState.milestoneMessages.halfway && gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.5) {
    gameState.milestoneMessages.halfway = true;
    showMilestoneMessage('50% reached: Halfway there!');
    return;
  }

  if (!gameState.milestoneMessages.threeQuarters && gameState.totalCollected >= CHANGE_THE_WORLD_TARGET * 0.75) {
    gameState.milestoneMessages.threeQuarters = true;
    showMilestoneMessage('75% reached: The finish line is close!');
  }
}

function checkWinCondition() {
  if (gameState.winReached) {
    return;
  }

  checkMilestoneProgressMessages();

  if (gameState.totalCollected >= CHANGE_THE_WORLD_TARGET) {
    gameState.winReached = true;
    updateDisplay();
    launchConfetti();
    showEventMessage('Victory: You changed the world!');
    saveGame();
  }
}

function saveGame() {
  const saveData = {
    waterDrops: gameState.waterDrops,
    totalCollected: gameState.totalCollected,
    clickPower: gameState.clickPower,
    productionMultiplier: gameState.productionMultiplier,
    volunteerMultiplier: gameState.volunteerMultiplier,
    winReached: gameState.winReached,
    milestoneMessages: {
      quarter: gameState.milestoneMessages.quarter,
      halfway: gameState.milestoneMessages.halfway,
      threeQuarters: gameState.milestoneMessages.threeQuarters
    },
    upgrades: {},
    boosts: {}
  };

  Object.keys(gameState.upgrades).forEach(function (key) {
    saveData.upgrades[key] = {
      count: gameState.upgrades[key].count,
      currentCost: gameState.upgrades[key].currentCost
    };
  });

  Object.keys(gameState.boosts).forEach(function (key) {
    saveData.boosts[key] = {
      purchased: gameState.boosts[key].purchased
    };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const savedDataText = localStorage.getItem(STORAGE_KEY);
  if (!savedDataText) {
    return;
  }

  try {
    const savedData = JSON.parse(savedDataText);

    gameState.waterDrops = savedData.waterDrops || 0;
    gameState.totalCollected = savedData.totalCollected || 0;
    gameState.clickPower = savedData.clickPower || 1;
    gameState.productionMultiplier = savedData.productionMultiplier || 1;
    gameState.volunteerMultiplier = savedData.volunteerMultiplier || 1;
    gameState.winReached = !!savedData.winReached;

    if (savedData.milestoneMessages) {
      gameState.milestoneMessages.quarter = !!savedData.milestoneMessages.quarter;
      gameState.milestoneMessages.halfway = !!savedData.milestoneMessages.halfway;
      gameState.milestoneMessages.threeQuarters = !!savedData.milestoneMessages.threeQuarters;
    }

    if (savedData.upgrades) {
      Object.keys(gameState.upgrades).forEach(function (key) {
        if (savedData.upgrades[key]) {
          gameState.upgrades[key].count = savedData.upgrades[key].count || 0;
          gameState.upgrades[key].currentCost = savedData.upgrades[key].currentCost || gameState.upgrades[key].baseCost;
        }
      });
    }

    if (savedData.boosts) {
      Object.keys(gameState.boosts).forEach(function (key) {
        if (savedData.boosts[key]) {
          gameState.boosts[key].purchased = !!savedData.boosts[key].purchased;
        }
      });
    }

    updateImpact();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resetGame() {
  const confirmReset = window.confirm('Reset all progress? This cannot be undone.');
  if (!confirmReset) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);

  gameState.waterDrops = 0;
  gameState.totalCollected = 0;
  gameState.peopleHelped = 0;
  gameState.communities = 0;
  gameState.wells = 0;
  gameState.countries = 0;
  gameState.clickPower = 1;
  gameState.productionMultiplier = 1;
  gameState.volunteerMultiplier = 1;
  gameState.winReached = false;
  gameState.milestoneMessages.quarter = false;
  gameState.milestoneMessages.halfway = false;
  gameState.milestoneMessages.threeQuarters = false;

  Object.keys(gameState.upgrades).forEach(function (key) {
    gameState.upgrades[key].count = 0;
    gameState.upgrades[key].currentCost = gameState.upgrades[key].baseCost;
  });

  Object.keys(gameState.boosts).forEach(function (key) {
    gameState.boosts[key].purchased = false;
  });

  eventMessageEl.textContent = '';
  milestoneMessageEl.textContent = '';
  updateDisplay();
  saveGame();
}

function showNextDidYouKnowFact() {
  didYouKnowTextEl.textContent = didYouKnowFacts[didYouKnowIndex];
  didYouKnowIndex += 1;

  if (didYouKnowIndex >= didYouKnowFacts.length) {
    didYouKnowIndex = 0;
  }
}

clicker.addEventListener('click', function () {
  playClickSound();

  addWater(getCurrentClickPower());
  updateDisplay();
  checkWinCondition();
  saveGame();
});

ui.handPump.button.addEventListener('click', function () {
  buyUpgrade('handPump');
});

ui.waterWell.button.addEventListener('click', function () {
  buyUpgrade('waterWell');
});

ui.filtrationSystem.button.addEventListener('click', function () {
  buyUpgrade('filtrationSystem');
});

ui.waterTower.button.addEventListener('click', function () {
  buyUpgrade('waterTower');
});

ui.reverseOsmosis.button.addEventListener('click', function () {
  buyUpgrade('reverseOsmosis');
});

ui.graderFastTrack.button.addEventListener('click', function () {
  buyUpgrade('graderFastTrack');
});

ui.volunteerCommunity.button.addEventListener('click', function () {
  buyUpgrade('volunteerCommunity');
});

ui.volunteerEngineer.button.addEventListener('click', function () {
  buyUpgrade('volunteerEngineer');
});

ui.volunteerEducator.button.addEventListener('click', function () {
  buyUpgrade('volunteerEducator');
});

ui.betterTools.button.addEventListener('click', function () {
  buyBoost('betterTools');
});

ui.efficiency.button.addEventListener('click', function () {
  buyBoost('efficiency');
});

ui.communityDrive.button.addEventListener('click', function () {
  buyBoost('communityDrive');
});

ui.smartLogistics.button.addEventListener('click', function () {
  buyBoost('smartLogistics');
});

resetGameBtn.addEventListener('click', resetGame);

setInterval(function () {
  const perSecond = getPerSecond();
  if (perSecond > 0) {
    const perTick = perSecond * (PRODUCTION_TICK_MS / 1000);
    addWater(perTick);
    updateDisplay();
    checkWinCondition();
  }
}, PRODUCTION_TICK_MS);

setInterval(function () {
  saveGame();
}, 2000);

setInterval(function () {
  triggerObstacle();
}, 20000);

setInterval(function () {
  showNextDidYouKnowFact();
}, 10000);

loadGame();
showNextDidYouKnowFact();
updateDisplay();
checkWinCondition();
