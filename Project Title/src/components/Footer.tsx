import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="lux-container py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <span className="font-serif text-lg font-semibold text-foreground">Lux</span>
            <p className="text-xs text-muted-foreground mt-1">
              Less noise, more substance.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <div className="lux-divider my-8" />

        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Lux. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
