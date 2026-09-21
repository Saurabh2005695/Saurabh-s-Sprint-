/**
 * Saurabh's Sprint - Dynamic Missions & Achievements Engine
 * Tracks in-run challenges, milestones and rewards
 */

class MissionManager {
  constructor() {
    this.missions = [
      {
        id: 'run_coins_50',
        title: 'Coin Collector',
        desc: 'Collect 50 coins in a single run',
        type: 'run_coins',
        target: 50,
        reward: 150,
        icon: 'COIN'
      },
      {
        id: 'run_score_3000',
        title: 'Speed Sprinter',
        desc: 'Score 3,000 points in a single run',
        type: 'run_score',
        target: 3000,
        reward: 200,
        icon: 'FAST'
      },
      {
        id: 'run_dist_500',
        title: 'Endurance Runner',
        desc: 'Sprint 500 meters in a single run',
        type: 'run_distance',
        target: 500,
        reward: 200,
        icon: 'DIST'
      },
      {
        id: 'use_hoverboard_3',
        title: 'Board Master',
        desc: 'Use hoverboards 3 times',
        type: 'stat_hoverboards',
        target: 3,
        reward: 250,
        icon: 'BRD'
      },
      {
        id: 'total_jumps_25',
        title: 'Acrobat',
        desc: 'Perform 25 hurdles & jumps',
        type: 'stat_jumps',
        target: 25,
        reward: 150,
        icon: 'JUMP'
      },
      {
        id: 'total_slides_20',
        title: 'Smooth Operator',
        desc: 'Perform 20 slides & ducks',
        type: 'stat_slides',
        target: 20,
        reward: 150,
        icon: 'SLID'
      },
      {
        id: 'total_powerups_10',
        title: 'Supercharged',
        desc: 'Collect 10 power-ups in total',
        type: 'stat_powerups',
        target: 10,
        reward: 300,
        icon: 'POWR'
      },
      {
        id: 'high_score_10000',
        title: 'Subway Legend',
        desc: 'Reach a High Score of 10,000',
        type: 'high_score',
        target: 10000,
        reward: 500,
        icon: 'HERO'
      }
    ];

    this.claimed = Storage.getMissionsData();
  }

  getProgress(mission, currentRun = null) {
    const stats = Storage.getStats();
    let current = 0;

    switch (mission.type) {
      case 'run_coins':
        current = currentRun ? currentRun.coins : (stats.bestRunCoins || 0);
        break;
      case 'run_score':
        current = currentRun ? currentRun.score : Storage.getHighScore();
        break;
      case 'run_distance':
        current = currentRun ? currentRun.distance : (stats.bestRunDistance || 0);
        break;
      case 'stat_hoverboards':
        current = stats.totalHoverboardsUsed || 0;
        break;
      case 'stat_jumps':
        current = stats.totalJumps || 0;
        break;
      case 'stat_slides':
        current = stats.totalSlides || 0;
        break;
      case 'stat_powerups':
        current = stats.totalPowerUpsCollected || 0;
        break;
      case 'high_score':
        current = Storage.getHighScore();
        break;
      default:
        current = 0;
    }

    const isCompleted = current >= mission.target;
    const isClaimed = !!this.claimed[mission.id];

    return {
      current: Math.min(Math.floor(current), mission.target),
      target: mission.target,
      isCompleted,
      isClaimed
    };
  }

  claim(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;

    const prog = this.getProgress(mission);
    if (prog.isCompleted && !prog.isClaimed) {
      this.claimed[missionId] = true;
      Storage.saveMissionsData(this.claimed);
      Storage.addCoins(mission.reward);
      Audio.playReward();
      return true;
    }
    return false;
  }

  getUnclaimedCount() {
    return this.missions.filter(m => {
      const p = this.getProgress(m);
      return p.isCompleted && !p.isClaimed;
    }).length;
  }
}

const Missions = new MissionManager();
