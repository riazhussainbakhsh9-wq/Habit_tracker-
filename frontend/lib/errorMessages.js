function toText(value) {
  return String(value || "").trim();
}

export function getFriendlyError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status;
  const serverError = toText(error?.response?.data?.error);
  const details = toText(error?.response?.data?.details);
  const raw = `${serverError} ${details}`.trim().toLowerCase();

  if (!error?.response) {
    return "Network error. Please check your internet connection and try again.";
  }

  if (raw.includes("already registered") || raw.includes("already exists") || raw.includes("duplicate key")) {
    return "This account already exists. Please login instead.";
  }

  if (raw.includes("invalid login credentials") || raw.includes("invalid credentials") || status === 401) {
    return "Email or password is incorrect.";
  }

  if (raw.includes("row-level security policy") || raw.includes("permission denied")) {
    return "Unable to save right now due to permission settings. Please try again in a moment.";
  }

  if (status === 409 || raw.includes("already exists") || raw.includes("already registered")) {
    return "This account already exists. Please login instead.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "Requested data was not found.";
  }

  if (status === 422 || raw.includes("validation")) {
    return "Some details are invalid. Please review your input and try again.";
  }

  if (status >= 500) {
    return "Server is temporarily unavailable. Please try again shortly.";
  }

  if (raw.includes("missing auth token") || raw.includes("invalid auth token")) {
    return "Your session expired. Please login again.";
  }

  return serverError || fallback;
}
