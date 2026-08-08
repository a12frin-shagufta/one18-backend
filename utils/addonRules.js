

const n = (v, fallback = null) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? fallback
    : Number(v);

export const normalizeGroup = (g = {}) => {
  const isQty = g.mode === "quantity";
  return {
    ...g,
    mode: isQty ? "quantity" : "price",
    step: isQty ? Math.max(1, n(g.step, 1)) : 1,
    minPerOption: isQty ? Math.max(0, n(g.minPerOption, 0)) : 0,
    maxPerOption: isQty ? n(g.maxPerOption) : null,
    maxOptions: n(g.maxOptions),
    totalQty: isQty ? n(g.totalQty) : null,
    totalRule: g.totalRule === "upTo" ? "upTo" : "exact",
  };
};

/* ------------------------------------------------------------------ */
/* 1. Admin-side: is this group even satisfiable?                      */
/* ------------------------------------------------------------------ */

export const groupConfigErrors = (raw) => {
  const g = normalizeGroup(raw);
  const errors = [];

  if (!g.groupName?.trim()) errors.push("Group name is required.");
  if (!g.options?.length || g.options.every((o) => !o.label?.trim()))
    errors.push(`"${g.groupName || "Group"}" needs at least one option.`);

  if (g.mode !== "quantity") {
    if (g.maxOptions !== null && g.maxOptions < 1)
      errors.push("Max options must be 1 or more.");
    return errors;
  }

  const { step, minPerOption, maxPerOption, maxOptions, totalQty } = g;

  if (totalQty === null || totalQty < 1)
    errors.push("Set the total quantity for this bundle (e.g. 12).");
  if (totalQty !== null && totalQty % step !== 0)
    errors.push(`Total quantity must be a multiple of ${step}.`);
  if (minPerOption % step !== 0)
    errors.push(`Minimum per option must be a multiple of ${step}.`);
  if (maxPerOption !== null) {
    if (maxPerOption % step !== 0)
      errors.push(`Maximum per option must be a multiple of ${step}.`);
    if (maxPerOption < minPerOption)
      errors.push("Maximum per option cannot be lower than the minimum.");
  }
  if (totalQty !== null && minPerOption > totalQty)
    errors.push("Minimum per option is larger than the total quantity.");
  if (maxOptions !== null && maxOptions < 1)
    errors.push("Max options must be 1 or more.");

  // Can the total actually be reached with the caps in place?
  if (totalQty !== null && maxPerOption !== null) {
    const slots = maxOptions ?? g.options.length;
    if (slots * maxPerOption < totalQty)
      errors.push(
        `${slots} option(s) capped at ${maxPerOption} can only reach ${
          slots * maxPerOption
        } — not ${totalQty}.`,
      );
  }

  return errors;
};

/* ------------------------------------------------------------------ */
/* 2. Customer-side: is this selection valid?                          */
/* ------------------------------------------------------------------ */

/** selection: { [optionLabel]: qty } */
export const summarize = (raw, selection = {}) => {
  const g = normalizeGroup(raw);
  const picked = Object.entries(selection)
    .map(([label, qty]) => [label, n(qty, 0)])
    .filter(([, qty]) => qty > 0);

  return {
    group: g,
    picked,
    total: picked.reduce((sum, [, qty]) => sum + qty, 0),
    count: picked.length,
    remaining:
      g.totalQty === null ? null : g.totalQty - picked.reduce((s, [, q]) => s + q, 0),
  };
};

export const validateSelection = (raw, selection = {}) => {
  const { group: g, picked, total, count } = summarize(raw, selection);
  const errors = [];

  if (total === 0) {
    if (g.required)
      errors.push(
        g.totalQty
          ? `Pick ${g.totalQty} pieces to continue.`
          : `Pick at least one option from "${g.groupName}".`,
      );
    return { valid: errors.length === 0, errors, total, count };
  }

  if (g.mode !== "quantity") {
    if (g.maxOptions !== null && count > g.maxOptions)
      errors.push(`Pick at most ${g.maxOptions} option(s).`);
    if (!g.multiSelect && count > 1) errors.push("Pick only one option.");
    return { valid: errors.length === 0, errors, total, count };
  }

  for (const [label, qty] of picked) {
    if (qty % g.step !== 0)
      errors.push(`${label} must be in multiples of ${g.step}.`);
    if (qty < g.minPerOption)
      errors.push(`${label} needs at least ${g.minPerOption} pieces.`);
    if (g.maxPerOption !== null && qty > g.maxPerOption)
      errors.push(`${label} is limited to ${g.maxPerOption} pieces.`);
  }

  if (g.maxOptions !== null && count > g.maxOptions)
    errors.push(`Choose up to ${g.maxOptions} flavours.`);

  if (g.totalQty !== null) {
    if (g.totalRule === "exact" && total !== g.totalQty) {
      const diff = g.totalQty - total;
      errors.push(
        diff > 0
          ? `Add ${diff} more to reach ${g.totalQty}.`
          : `Remove ${-diff} to get back to ${g.totalQty}.`,
      );
    }
    if (g.totalRule === "upTo" && total > g.totalQty)
      errors.push(`Maximum ${g.totalQty} pieces.`);
  }

  return { valid: errors.length === 0, errors, total, count };
};

/* ------------------------------------------------------------------ */
/* 3. Button state helpers for the customer UI                         */
/* ------------------------------------------------------------------ */

export const stepUpTo = (raw, selection, label) => {
  const { group: g, total, count } = summarize(raw, selection);
  const current = n(selection?.[label], 0);
  const next = current === 0 ? Math.max(g.step, g.minPerOption) : current + g.step;

  if (current === 0 && g.maxOptions !== null && count >= g.maxOptions) return null;
  if (g.maxPerOption !== null && next > g.maxPerOption) return null;
  if (g.totalQty !== null && total - current + next > g.totalQty) return null;
  return next;
};

export const stepDownTo = (raw, selection, label) => {
  const g = normalizeGroup(raw);
  const current = n(selection?.[label], 0);
  if (current <= 0) return null;
  const next = current - g.step;
  return next < g.minPerOption ? 0 : next; // dropping below the minimum clears it
};

export const addOnsTotalPrice = (groups = [], selections = {}) =>
  groups.reduce((sum, g, gi) => {
    const sel = selections[gi] || {};
    if (g.mode === "quantity") return sum; // quantity groups are included in the base price
    return (
      sum +
      (g.options || []).reduce(
        (s, o) => s + (sel[o.label] > 0 ? Number(o.price) || 0 : 0),
        0,
      )
    );
  }, 0);