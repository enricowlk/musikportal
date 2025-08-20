// components/Navigation/NavBar.tsx
'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiHome, FiUpload, FiList, FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../Theme/ThemeProvider";
import { useUser } from "@/app/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { permissions, role, isLoading: userLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Don't render navbar until user data is loaded
  if (userLoading) {
    return null;
  }

  // For formations, show only minimal navbar with theme toggle
  const isFormation = role === 'formation';

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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-3"
                >
                  {/* Soundwave Icon */}
                  <motion.div 
                    className="flex items-center h-6 space-x-1"
                    animate={{ transition: { staggerChildren: 0.1 } }}
                  >
                    {[0.8, 1.2, 0.7, 1.5, 0.6].map((height, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [`${height * 16}px`, `${height * 22}px`],
                          transition: {
                            duration: 1 + i * 0.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }
                        }}
                        className="w-1 bg-[var(--foreground-alt)] dark:bg-[var(--foreground)] rounded-full"
                      />
                    ))}
                  </motion.div>

                  <motion.span
                    className="text-base font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]"
                    whileHover={{ 
                      color: "var(--foreground)",
                      filter: "brightness(1.2)" 
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    DTV Musikportal
                  </motion.span>
                </motion.div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {!isFormation && (
                <>
                  {permissions?.canAccessDashboard && (
                    <NavLink 
                      href="/dashboard" 
                      icon={<FiHome />} 
                      text="Dashboard" 
                      isActive={pathname === '/dashboard'}
                    />
                  )}
                  {permissions?.canViewPlaylists && (
                    <NavLink 
                      href="/dashboard/playlists" 
                      icon={<FiList />} 
                      text="Playlists" 
                      isActive={pathname.startsWith('/dashboard/playlists')}
                    />
                  )}
                </>
              )}
              {permissions?.canUpload && (
                <NavLink 
                  href="/dashboard/upload" 
                  icon={<FiUpload />} 
                  text="Upload" 
                  isActive={pathname === '/dashboard/upload'}
                />
              )}
              
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
              
              {!isFormation && (
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
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && !isFormation && (
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
                {permissions?.canAccessDashboard && (
                  <MobileNavLink 
                    href="/dashboard" 
                    icon={<FiHome />} 
                    text="Dashboard" 
                    isActive={pathname === '/dashboard'}
                    onClick={toggleMobileMenu}
                  />
                )}
                {permissions?.canViewPlaylists && (
                  <MobileNavLink 
                    href="/dashboard/playlists" 
                    icon={<FiList />} 
                    text="Playlists" 
                    isActive={pathname.startsWith('/dashboard/playlists')}
                    onClick={toggleMobileMenu}
                  />
                )}
                {permissions?.canUpload && (
                  <MobileNavLink 
                    href="/dashboard/upload" 
                    icon={<FiUpload />} 
                    text="Upload" 
                    isActive={pathname === '/dashboard/upload'}
                    onClick={toggleMobileMenu}
                  />
                )}
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