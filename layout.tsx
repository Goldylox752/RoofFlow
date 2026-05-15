import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black text-white min-h-screen">

          {/* TOP NAVBAR */}
          <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">

            {/* BRAND */}
            <Link
              href="/dashboard"
              className="font-semibold text-lg tracking-tight"
            >
              Revenue OS
            </Link>

            {/* NAV LINKS */}
            <nav className="flex items-center gap-6 text-sm text-white/70">

              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>

              <Link href="/leads" className="hover:text-white">
                Leads
              </Link>

              <Link href="/pipeline" className="hover:text-white">
                Pipeline
              </Link>

              <Link href="/analytics" className="hover:text-white">
                Analytics
              </Link>

              {/* USER */}
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

            </nav>
          </header>

          {/* AUTH GATE */}
          <SignedOut>
            <div className="flex items-center justify-center min-h-[80vh] px-6">
              <div className="text-center space-y-4 max-w-md">
                <h1 className="text-2xl font-semibold">
                  Access Required
                </h1>

                <p className="text-white/60 text-sm">
                  Sign in to access your CRM, AI insights, and revenue dashboard.
                </p>

                <Link
                  href="/sign-in"
                  className="inline-block px-4 py-2 bg-white text-black rounded"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </SignedOut>

          {/* APP CONTENT */}
          <SignedIn>
            <div className="flex">

              {/* OPTIONAL SIDEBAR (ready for upgrade) */}
              <aside className="hidden md:block w-64 border-r border-white/10 min-h-[calc(100vh-65px)] p-4">
                <div className="space-y-3 text-sm text-white/70">

                  <Link href="/dashboard" className="block hover:text-white">
                    Overview
                  </Link>

                  <Link href="/leads" className="block hover:text-white">
                    Leads CRM
                  </Link>

                  <Link href="/pipeline" className="block hover:text-white">
                    Pipeline
                  </Link>

                  <Link href="/analytics" className="block hover:text-white">
                    Analytics
                  </Link>

                  <Link href="/settings" className="block hover:text-white">
                    Settings
                  </Link>

                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="flex-1 p-6">
                {children}
              </main>

            </div>
          </SignedIn>

        </body>
      </html>
    </ClerkProvider>
  );
}