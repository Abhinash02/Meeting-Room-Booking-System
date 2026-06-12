import DailyQuota from '../models/DailyQuota.js';

const DAILY_QUOTA_MINUTES = 4 * 60;

export async function reserveDailyQuota(email, date, minutes, session) {
  const normalized = email.toLowerCase();

  await DailyQuota.findOneAndUpdate(
    { email: normalized, date },
    { $setOnInsert: { email: normalized, date } },
    { upsert: true, session }
  );

  const updated = await DailyQuota.findOneAndUpdate(
    { email: normalized, date, usedMinutes: { $lte: DAILY_QUOTA_MINUTES - minutes } },
    { $inc: { usedMinutes: minutes } },
    { new: true, session }
  );

  if (!updated) {
    const current = await DailyQuota.findOne({ email: normalized, date }).session(session).lean();
    const used = current?.usedMinutes || 0;

    return {
      ok: false,
      reason: `Daily quota exceeded for ${date}. Used ${used} min, requested ${minutes} min (max ${DAILY_QUOTA_MINUTES} min/day).`,
      date,
      usedMinutes: used,
      requestedMinutes: minutes,
      maxMinutes: DAILY_QUOTA_MINUTES,
    };
  }

  return { ok: true, usedMinutes: updated.usedMinutes };
}

export async function releaseDailyQuota(email, date, minutes, session) {
  await DailyQuota.findOneAndUpdate(
    { email: email.toLowerCase(), date },
    { $inc: { usedMinutes: -minutes } },
    { session }
  );
}

export { DAILY_QUOTA_MINUTES };
