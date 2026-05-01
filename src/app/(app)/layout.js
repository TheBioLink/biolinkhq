"use client";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}
