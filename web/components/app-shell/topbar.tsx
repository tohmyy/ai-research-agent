import { UserMenu } from "./user-menu";

export function AppTopbar({
  user,
}: {
  user: { name: string; email: string };
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div />
      <UserMenu name={user.name} email={user.email} />
    </header>
  );
}
