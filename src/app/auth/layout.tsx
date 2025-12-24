export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 top-1/3 h-32 w-32 bg-primary/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute right-0 bottom-1/3 h-32 w-32 bg-fuchsia-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        {children}
    </div>
  );
}
