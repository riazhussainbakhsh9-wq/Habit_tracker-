import AppShell from "./AppShell";

export default function Layout({ user, onLogout, children }) {
  return <AppShell user={user} onLogout={onLogout} active="" title={null} subtitle={null}>{children}</AppShell>;
}
