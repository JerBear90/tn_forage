import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up — ForageFlow",
  description: "Create a ForageFlow account to sync trips, logs, and more.",
};

const ssoProviders = [
  { name: "Google", icon: "G", bgClass: "bg-white border-gray-300 text-brand-charcoal hover:bg-gray-50" },
  { name: "Apple", icon: "", bgClass: "bg-brand-charcoal text-white hover:bg-brand-charcoal/90 dark:bg-white dark:text-brand-charcoal dark:hover:bg-gray-100" },
  { name: "Microsoft", icon: "⊞", bgClass: "bg-white border-gray-300 text-brand-charcoal hover:bg-gray-50" },
];

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-teal font-heading mb-1">
          Join ForageFlow
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
          Create an account to sync your trips, logs, and species data across
          devices.
        </p>
      </div>

      {/* SSO buttons */}
      <section aria-label="Sign up with SSO" className="w-full space-y-2 mb-6">
        {ssoProviders.map((provider) => (
          <button
            key={provider.name}
            type="button"
            className={`w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] ${provider.bgClass}`}
          >
            <span aria-hidden="true" className="text-base">{provider.icon}</span>
            Continue with {provider.name}
          </button>
        ))}
      </section>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full mb-6">
        <div className="flex-1 h-px bg-brand-charcoal/10 dark:bg-brand-sand/10" />
        <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">
          or sign up with email
        </span>
        <div className="flex-1 h-px bg-brand-charcoal/10 dark:bg-brand-sand/10" />
      </div>

      {/* Email/password form */}
      <form className="w-full space-y-4 mb-6">
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Display Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
          <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
            At least 8 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="signup-password-confirm"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
        >
          Create Account
        </button>
      </form>

      {/* Links */}
      <div className="text-center space-y-2">
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Safety note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-8 max-w-xs">
        By creating an account you agree that ForageFlow provides identification
        assistance only. Always verify species with a qualified expert.
      </p>
    </main>
  );
}
