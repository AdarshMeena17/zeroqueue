// Turns an axios error into a message safe to show the user.
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err?.response) return 'Cannot reach the server. Check your connection.';
  return fallback;
}
