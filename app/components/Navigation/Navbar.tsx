// components/Navigation/NavBar.tsx
'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiHome, FiMusic, FiUpload, FiList, FiMenu, FiX, FiSun, FiMoon, FiUser } from "react-icons/fi";
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
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        className={`sticky top-0 z-50 ${scrolled ? 'shadow-lg backdrop-blur-sm bg-opacity-90' : 'shadow-sm'} border-b border-gray-200 dark:border-gray-800`}
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
                    Musikportal
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
              
              {/* Theme Toggle Button */}
              <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full transition-all duration-300 transform-gpu"
            >
              {theme === 'light' ? (
                <FiSun className="text-lg text-black hover:text-yellow-500" />
              ) : (
                <FiMoon className="text-lg text-gray-300 hover:text-blue-400" />
              )}
            </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`
                  p-2 rounded-full 
                  text-gray-700 dark:text-gray-300 
                  hover:text-yellow-500 dark:hover:text-blue-400
                  transition-all duration-300
                  hover:bg-gray-100 dark:hover:bg-gray-700/50
                  transform-gpu
                `}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMobileMenu}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none transition-colors"
                aria-label="Menü öffnen"
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
              className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
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
      
      {/* Dieser div sorgt für den Abstand unter der Navbar */}
      <div className="h-16"></div>
    </>
  );
}

// Desktop NavLink Komponente
function NavLink({ 
  href, 
  icon, 
  text, 
  isActive 
}: { 
  href: string; 
  icon: React.ReactNode; 
  text: string;
  isActive: boolean;
}) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center transition-all font-medium relative group`}
      >
        <span className="mr-2">{icon}</span>
        {text}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: isActive ? '100%' : 0 }}
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
        />
        {!isActive && (
          <motion.div 
            className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
            initial={{ width: 0 }}
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

// Mobile NavLink Komponente
function MobileNavLink({ 
  href, 
  icon, 
  text, 
  isActive,
  onClick
}: { 
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
        style={{ color: 'var(--foreground)' }}
        className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
          isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        } transition-colors`}
      >
        <span className="mr-3">{icon}</span>
        {text}
      </motion.div>
    </Link>
  );
}