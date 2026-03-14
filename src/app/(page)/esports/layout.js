export const metadata = {
  title: "Esports Profiles",
  description: "Discover esports players, coaches, and teams",
};

export default function EsportsLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
