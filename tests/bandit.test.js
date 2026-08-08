const { banditPickClip, banditReward } = require('../src/bandit');

describe('Bandit Logic', () => {
  const clips = [{ label: 'A' }, { label: 'B' }, { label: 'C' }];
  const recorded = [...clips];

  test('banditReward updates score correctly', () => {
    let state = {};
    state = banditReward(0, 10, state);
    expect(state[0].plays).toBe(1);
    expect(state[0].score).toBe(10);
    
    state = banditReward(0, 20, state);
    expect(state[0].plays).toBe(2);
    expect(state[0].score).toBe(15); // (10 + 20) / 2
  });

  test('banditPickClip exploits the best phrase', () => {
    const state = {
      0: { plays: 10, totalGap: 100, score: 10 },
      1: { plays: 10, totalGap: 500, score: 50 }, // Best
      2: { plays: 10, totalGap: 200, score: 20 },
    };
    
    // Set epsilon to 0 to force exploitation
    const result = banditPickClip(recorded, clips, 0, state);
    expect(result.key).toBe(1);
    expect(result.clip.label).toBe('B');
  });

  test('banditPickClip handles unplayed clips with bonus', () => {
    const state = {
      0: { plays: 10, totalGap: 100, score: 10 },
      // Clip 1 and 2 are unplayed
    };
    
    const result = banditPickClip(recorded, clips, 0, state);
    // Should pick either 1 or 2 due to the 1000 bonus
    expect([1, 2]).toContain(result.key);
  });
});