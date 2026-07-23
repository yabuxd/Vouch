import rateLimit from 'express-rate-limit';

/** Baseline limit for authenticated API traffic (per IP). */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

/** Invite-code join attempts — mitigates brute-force guessing. */
export const joinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many join attempts. Try again later.' },
});

/** Submission votes — prevents rapid automated voting. */
export const voteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many votes. Try again later.' },
});

/** File uploads — limits storage abuse. */
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Try again later.' },
});
