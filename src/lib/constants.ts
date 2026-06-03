export const qroadPackages = [
  "Pre-Launch QA Package",
  "Store & Platform QA Package",
  "Global Launch Localization Package",
  "Launch Operation Support Package",
  "Pre-Registration Marketing Package",
  "Game Creative Production Package",
  "AI Community & CS Monitoring Package"
] as const;

export const launchStages = [
  "pre_announcement",
  "in_development",
  "cbt_scheduled",
  "obt_scheduled",
  "soft_launch_scheduled",
  "pre_registration",
  "steam_wishlist",
  "steam_playtest",
  "early_access_scheduled",
  "launch_scheduled",
  "regional_launch_scheduled",
  "global_launch_scheduled",
  "platform_expansion_scheduled",
  "expansion_pack_scheduled",
  "relaunch_scheduled",
  "already_launched",
  "post_launch_only",
  "unknown"
] as const;

export const includedStages = new Set([
  "cbt_scheduled",
  "obt_scheduled",
  "soft_launch_scheduled",
  "pre_registration",
  "steam_wishlist",
  "steam_playtest",
  "early_access_scheduled",
  "launch_scheduled",
  "regional_launch_scheduled",
  "global_launch_scheduled",
  "platform_expansion_scheduled",
  "expansion_pack_scheduled",
  "relaunch_scheduled"
]);

export const conditionalStages = new Set(["pre_announcement", "in_development"]);
