// While the setup guide waits for the test message, the app leaves the bank-message inbox alone
// (App.tsx checkInbox), so the guide can spot the test and remove it instead of it being logged.
export const inboxPause = { on: false };
