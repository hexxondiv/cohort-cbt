export function toClientTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.includes("T")) {
    return value;
  }

  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

export function formatFixedTimestamp(value: string | null | undefined) {
  const normalized = toClientTimestamp(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export function getRemainingSeconds(startedAt: string, durationMinutes: number, now = Date.now()) {
  const endAt = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return Math.floor((endAt - now) / 1000);
}
