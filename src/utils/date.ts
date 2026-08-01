function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export const formatBusinessDate = (date?: string | Date, format: string = "LL"): string => {
  const value = date ? new Date(date) : new Date();

  if (format === "YYYY-MM-DD HH:mm:ss") {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  return value.toISOString();
};

export const businessTimestamp = (date?: Date): Date => {
  return date ? new Date(date) : new Date();
};
