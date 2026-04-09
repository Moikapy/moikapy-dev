import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">
        Page not found. Maybe it was here in a parallel universe.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back home
      </Link>
    </div>
  );
}