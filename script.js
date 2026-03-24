const STORAGE_KEY = 'waterForAllSaveV1';

const gameState = {
  waterDrops: 0,
  totalCollected: 0,
  peopleHelped: 0,
  communities: 0,
  wells: 0,
  clickPower: 1,
  productionMultiplier: 1,
  volunteerMultiplier: 1,
  winReached: false,
  upgrades: {
    handPump: { count: 0, baseCost: 10, currentCost: 10, perSecond: 1, isVolunteer: false },
    waterWell: { count: 0, baseCost: 100, currentCost: 100, perSecond: 5, isVolunteer: false },
    filtrationSystem: { count: 0, baseCost: 500, currentCost: 500, perSecond: 25, isVolunteer: false },
    waterTower: { count: 0, baseCost: 2500, currentCost: 2500, perSecond: 100, isVolunteer: false },
    reverseOsmosis: { count: 0, baseCost: 6000, currentCost: 6000, perSecond: 300, isVolunteer: false },
    graderFastTrack: { count: 0, baseCost: 1, currentCost: 1, perSecond: 500, isVolunteer: false },
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
const peopleProgressEl = document.getElementById('people-progress');
const communitiesProgressEl = document.getElementById('communities-progress');
const clickerSubtextEl = document.querySelector('.clicker-subtext');
const resetGameBtn = document.getElementById('reset-game-btn');
const eventMessageEl = document.getElementById('event-message');
const winMessageEl = document.getElementById('win-message');
const confettiContainer = document.getElementById('confetti-container');
const didYouKnowTextEl = document.getElementById('did-you-know-text');

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

function addWater(amount) {
  gameState.waterDrops += amount;
  gameState.totalCollected += amount;
  updateImpact();
}

function removeWater(amount) {
  gameState.waterDrops = Math.max(0, gameState.waterDrops - amount);
}

function updateImpact() {
  gameState.peopleHelped = Math.floor(gameState.totalCollected / 10);
  gameState.communities = Math.floor(gameState.peopleHelped / 100);
  gameState.wells = Math.floor(gameState.communities / 5);
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

function updateProgressBars() {
  const peoplePercent = gameState.peopleHelped % 100;
  const communitiesPercent = (gameState.communities % 10) * 10;

  peopleProgressEl.style.width = peoplePercent + '%';
  communitiesProgressEl.style.width = communitiesPercent + '%';

  const milestone1Percent = Math.min((gameState.totalCollected / 10) * 100, 100);
  const milestone2Percent = Math.min((gameState.totalCollected / 1000) * 100, 100);
  const milestone3Percent = Math.min((gameState.totalCollected / 10000) * 100, 100);

  milestone1El.style.width = milestone1Percent + '%';
  milestone2El.style.width = milestone2Percent + '%';
  milestone3El.style.width = milestone3Percent + '%';

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

  waterDropsEl.textContent = formatNumber(gameState.waterDrops);
  perSecondEl.textContent = formatNumber(perSecond) + '/s';
  peopleHelpedEl.textContent = formatNumber(gameState.peopleHelped);
  communitiesEl.textContent = formatNumber(gameState.communities);
  wellsEl.textContent = formatNumber(gameState.wells);
  clickerSubtextEl.textContent = '+' + formatNumber(gameState.clickPower) + ' per click';

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
  upgrade.currentCost = Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.count));

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
    gameState.clickPower = gameState.clickPower + 3;
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

function checkWinCondition() {
  if (gameState.winReached) {
    return;
  }

  if (gameState.totalCollected >= 10000) {
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
  gameState.clickPower = 1;
  gameState.productionMultiplier = 1;
  gameState.volunteerMultiplier = 1;
  gameState.winReached = false;

  Object.keys(gameState.upgrades).forEach(function (key) {
    gameState.upgrades[key].count = 0;
    gameState.upgrades[key].currentCost = gameState.upgrades[key].baseCost;
  });

  Object.keys(gameState.boosts).forEach(function (key) {
    gameState.boosts[key].purchased = false;
  });

  eventMessageEl.textContent = '';
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
  addWater(gameState.clickPower);
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
    addWater(perSecond);
    updateDisplay();
    checkWinCondition();
  }
}, 1000);

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
