import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Logo } from "./ui/logo";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group gap-2">
            <Logo className="h-10 w-10 group-hover:rotate-12 transition-transform duration-500" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ExpensaCheck
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {[
              { path: "/analizar", label: "Analizar" },
              { path: "/evolucion", label: "Evolución" },
              { path: "/ahorro", label: "Ahorro" },
              { path: "/historial", label: "Historial" },
              { path: "/comparar", label: "Comparar" },
              { path: "/preparar-reunion", label: "Preparar Reunión" }
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${isActive(link.path)
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-accent rounded-xl w-11 h-11 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-in fade-in slide-in-from-top-4 duration-300 pb-6 space-y-2">
            {[
              { path: "/analizar", label: "Analizar" },
              { path: "/evolucion", label: "Evolución" },
              { path: "/ahorro", label: "Ahorro" },
              { path: "/historial", label: "Historial" },
              { path: "/comparar", label: "Comparar" },
              { path: "/preparar-reunion", label: "Preparar Reunión" }
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-6 py-4 rounded-2xl text-lg font-bold transition-all ${isActive(link.path)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
