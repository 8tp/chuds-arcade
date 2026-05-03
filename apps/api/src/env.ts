export type Env = {
  DB: D1Database;
  REPLAYS: R2Bucket;
  RUN_NONCE_SECRET: string;
  GUEST_TOKEN_SECRET: string;
  ALLOWED_ORIGIN: string;
};
