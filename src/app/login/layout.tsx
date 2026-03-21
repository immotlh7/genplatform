export const metadata = {
  title: "Login - GenPlatform",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-background"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      {children}
    </div>
  );
}
