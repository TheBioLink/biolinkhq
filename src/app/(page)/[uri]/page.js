// ONLY badge rendering updated

            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {badges.map((b, i) => (
                  <a
                    key={i}
                    href={b.targetUri ? `/${b.targetUri}` : "#"}
                    className="group relative"
                  >
                    <img src={b.icon} className="h-6 w-6" />

                    <div className="absolute top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black border border-white/10 text-xs px-2 py-1 rounded-lg whitespace-nowrap z-50">
                      {b.tagline || b.name}
                    </div>
                  </a>
                ))}
              </div>
            )}
