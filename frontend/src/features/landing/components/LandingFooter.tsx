import { Button } from '@shared/ui/Button';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="font-extrabold text-purple-600">ficheproduct</span>
          <span className="text-gray-400 text-sm ml-3">© 2025</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-purple-700 transition-colors duration-200">
            À propos
          </a>
          <a href="#" className="hover:text-purple-700 transition-colors duration-200">
            CGU
          </a>
          <a href="#" className="hover:text-purple-700 transition-colors duration-200">
            Contact
          </a>
          <Button href="/signup" variant="ghost" size="sm">
            S&apos;inscrire
          </Button>
        </div>
      </div>
    </footer>
  );
}
