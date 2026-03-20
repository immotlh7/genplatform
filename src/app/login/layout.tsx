import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - GenPlatform",
  description: "Sign in to your GenPlatform account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page has its own clean layout without sidebar or dashboard shell
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
