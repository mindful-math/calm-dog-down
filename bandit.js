/**
 * Multi-armed bandit logic for phrase selection
 */

function banditPickClip(recorded, clips, epsilon = 0.15, banditState = {}) {
  // Initialise missing entries
  recorded.forEach((_, i) => {
    const key = clips.indexOf(_);
    if (!banditState[key]) {
      banditState[key] = { plays: 0, totalGap: 0, score: 0 };
    }
  });

  // epsilon-greedy
  if (Math.random() < epsilon || recorded.length === 1) {
    const randomIndex = Math.floor(Math.random() * recorded.length);
    return { 
      clip: recorded[randomIndex],
      key: clips.indexOf(recorded[randomIndex]) 
    };
  }

  // Exploit: pick highest score; score = avg gap (s) or 0 if never played
  let best = null, bestScore = -1, bestKey = -1;
  for (const clip of recorded) {
    const k = clips.indexOf(clip);
    const entry = banditState[k] || { plays: 0, totalGap: 0, score: 0 };
    // UCB-like bonus for unplayed clips
    const bonus = entry.plays === 0 ? 1000 : 0;
    const sc = entry.score + bonus;
    if (sc > bestScore) { 
      bestScore = sc; 
      best = clip; 
      bestKey = k; 
    }
  }
  return { clip: best, key: bestKey };
}

function banditReward(key, gapSeconds, banditState) {
  if (!banditState[key]) {
    banditState[key] = { plays: 0, totalGap: 0, score: 0 };
  }
  const e = banditState[key];
  e.plays++;
  e.totalGap += gapSeconds;
  e.score = e.totalGap / e.plays;
  return banditState;
}

module.exports = { banditPickClip, banditReward };