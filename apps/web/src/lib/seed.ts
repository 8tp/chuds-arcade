// Re-export from the SDK so web + worker agree on the seed contract.
export {
  dailySeed,
  todayUtc,
  nextDailyResetMs,
  isValidDailyDate,
  DEFAULT_SEASON_SALT,
} from "@chuds/arcade-sdk/seed";
