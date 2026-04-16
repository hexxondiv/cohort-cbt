export function normalizePhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+234${digits}`;
  }

  if (digits.length === 13 && digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.length === 14 && digits.startsWith("234")) {
    return `+${digits.slice(0, 13)}`;
  }

  if (digits.length === 13 && digits.startsWith("0")) {
    return `+${digits.slice(1)}`;
  }

  throw new Error("Enter a valid Nigerian phone number.");
}
