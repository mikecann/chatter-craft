export const errorToString = (error: unknown): string => {
  if (error == undefined) return "";
  if (error instanceof Error) return `${error.name} - ${error.message}\n\n${error.stack}`;
  if (typeof error == "object") {
    if (error && "reason" in error) return errorToString(error.reason);
    if (error && "message" in error) return errorToString(error.message);
    return JSON.stringify(error);
  }
  return String(error);
};
