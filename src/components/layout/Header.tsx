interface HeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function Header({ title, action }: HeaderProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-[var(--color-border)] bg-white">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
      {action && <div>{action}</div>}
    </header>
  );
}
