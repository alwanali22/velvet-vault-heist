// Tuning for Velvet Vault: every number the game balances on lives here, so a
// balance pass touches this file and nothing else.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const STEP = 1 / 60;

// The thief.
export const THIEF_RADIUS = 13;
export const WALK_SPEED = 165;
export const SNEAK_SPEED = 92;
export const RUN_SPEED = 235;
export const NOISE_WALK = 52;
export const NOISE_SNEAK = 22;
export const NOISE_RUN = 105;

// Guards: patrol speed, chase speed, vision cone and how fast being seen fills.
export const GUARD_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_CONE_RANGE = 185;
export const GUARD_CONE_HALF = 0.62; // ~71 degrees full cone
export const GUARD_SEEN_RATE = 1.5; // per second of full exposure
export const GUARD_SEEN_DECAY = 0.8;
export const GUARD_HEAR_RADIUS = 130;
export const GUARD_GIVE_UP = 4.0; // seconds without seeing the thief before resuming patrol
export const GUARD_CATCH_RADIUS = 26;

// Cameras sweep and spot faster than guards, but cannot move.
export const CAMERA_RANGE = 215;
export const CAMERA_HALF = 0.5;
export const CAMERA_ALARM_RATE = 26; // alarm points per second while spotted
export const CAMERA_SWEEP_SPEED = 0.45;

// Alarm: 0..100. Rises while spotted, decays while hidden. 100 means busted.
export const ALARM_GUARD_RATE = 16;
export const ALARM_DECAY = 2.6;
export const ALARM_LASER_TRIP = 22;
// A guard's grab is a heavy alarm hit, not an instant bust: the thief slips
// away with a 2.5 s window to break line of sight, so a chase stays fair.
export const ALARM_CATCH_TOUCH = 60;
export const GUARD_TOUCH_COOLDOWN = 2.5;

// Tools. Each use is charged against the level payout, so tools cost loot.
export const TOOL_SMOKE_COST = 150;
export const TOOL_EMP_COST = 250;
export const SMOKE_DURATION = 5.0;
export const SMOKE_RADIUS = 95;
export const EMP_DURATION = 6.0;
export const LOCKPICK_TIME = 2.0;
export const LOCKPICK_VAULT_TIME = 2.5;

// Scoring.
export const TIME_BONUS_PER_SEC = 12;
export const ALARM_PENALTY_PER_POINT = 4;
