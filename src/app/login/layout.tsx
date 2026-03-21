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
  return (
    <>
      {/* Hide sidebar and navbar on login page */}
      <style>{`
        aside, nav, .lg\\:pl-72, [class*="sidebar"], [class*="Sidebar"],
        header { display: none !important; }
        .lg\\:pl-72 { padding-left: 0 !important; }
        main { padding: 0 !important; }
      `}</style>
      <div className="min-h-screen bg-background flex items-center justify-center">
        {children}
      </div>
    </>
  );
}
