// components/Navigation/NavBar.tsx
'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiHome, FiMusic, FiUpload, FiList, FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../Theme/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-50 bg-[var(--navbar-bg)] text-[var(--navbar-text)] ${
          scrolled ? 'shadow-lg backdrop-blur-sm bg-opacity-90' : 'shadow-sm'
        }`}
        suppressHydrationWarning
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center text-blue-600 dark:text-blue-400 font-bold"
                >
                  <FiMusic className="mr-2 text-xl group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors" />
                  <span className="group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                    DTV Musikportal
                  </span>
                </motion.div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLink 
                href="/dashboard" 
                icon={<FiHome />} 
                text="Dashboard" 
                isActive={pathname === '/dashboard'}
              />
              <NavLink 
                href="/dashboard/playlists" 
                icon={<FiList />} 
                text="Playlists" 
                isActive={pathname.startsWith('/dashboard/playlists')}
              />
              <NavLink 
                href="/dashboard/upload" 
                icon={<FiUpload />} 
                text="Upload" 
                isActive={pathname === '/dashboard/upload'}
              />
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-full transition-all duration-300 transform-gpu"
              >
                {theme === 'light' ? (
                  <FiSun className="text-lg text-[var(--navbar-icon)] hover:text-yellow-500" />
                ) : (
                  <FiMoon className="text-lg text-[var(--navbar-icon)] hover:text-blue-400" />
                )}
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-full text-[var(--navbar-icon)] hover:text-[var(--navbar-icon-hover)] transition-all"
              >
                {theme === 'light' ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMobileMenu}
                className="text-[var(--navbar-icon)] hover:text-[var(--navbar-icon-hover)] focus:outline-none transition-colors"
              >
                {mobileMenuOpen ? (
                  <FiX className="text-xl" />
                ) : (
                  <FiMenu className="text-xl" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-[var(--navbar-bg)] border-t border-[var(--navbar-border)]"
              style={{ 
                backdropFilter: scrolled ? 'blur(8px)' : 'none',
                backgroundColor: scrolled ? 'var(--navbar-bg-scrolled)' : 'var(--navbar-bg)'
              }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <MobileNavLink 
                  href="/dashboard" 
                  icon={<FiHome />} 
                  text="Dashboard" 
                  isActive={pathname === '/dashboard'}
                  onClick={toggleMobileMenu}
                />
                <MobileNavLink 
                  href="/dashboard/playlists" 
                  icon={<FiList />} 
                  text="Playlists" 
                  isActive={pathname.startsWith('/dashboard/playlists')}
                  onClick={toggleMobileMenu}
                />
                <MobileNavLink 
                  href="/dashboard/upload" 
                  icon={<FiUpload />} 
                  text="Upload" 
                  isActive={pathname === '/dashboard/upload'}
                  onClick={toggleMobileMenu}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      <div className="h-16"></div>
    </>
  );
}

// Desktop NavLink Komponente
function NavLink({ href, icon, text, isActive }: { href: string; icon: React.ReactNode; text: string; isActive: boolean }) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center transition-all font-medium relative group pb-1"
      >
        <span className="mr-2">{icon}</span>
        {text}
        {isActive && (
          <motion.svg 
            className="absolute bottom-0 left-0 w-full h-1"
            viewBox="0 0 100 5"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,2 C20,5 40,0 60,3 C80,6 90,0 100,2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </motion.svg>
        )}
      </motion.div>
    </Link>
  );
}

// Mobile NavLink Komponente
function MobileNavLink({ href, icon, text, isActive, onClick }: { 
  href: string; 
  icon: React.ReactNode; 
  text: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
          flex items-center px-3 py-3 rounded-md text-base font-medium
          ${
            isActive 
              ? 'bg-[var(--navbar-active-bg)] text-[var(--navbar-active-text)]' 
              : 'text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)]'
          }
          transition-colors duration-200
          border-l-4 ${isActive ? 'border-[var(--navbar-active-border)]' : 'border-transparent'}
        `}
      >
        <span className={`mr-3 ${isActive ? 'text-[var(--navbar-active-icon)]' : ''}`}>
          {icon}
        </span>
        {text}
        {isActive && (
          <motion.span 
            className="ml-auto h-2 w-2 rounded-full bg-[var(--navbar-active-border)]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          />
        )}
      </motion.div>
    </Link>
  );
}