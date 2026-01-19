
import React, { useEffect } from 'react';

interface DigitalKhattProviderProps {
  children: React.ReactNode;
}

export const DigitalKhattProvider: React.FC<DigitalKhattProviderProps> = ({ children }) => {
  useEffect(() => {
    const links = [
      {
        rel: 'stylesheet',
        href: 'https://digitalkhatt.org/cdn/digitalmushaf/digitalkhatt.css'
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com'
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous'
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Amiri&family=Scheherazade+New&display=swap'
      }
    ];
    
    const createdLinks = links.map(linkData => {
      const link = document.createElement('link');
      Object.entries(linkData).forEach(([key, value]) => {
        if (value !== undefined) {
          link.setAttribute(key, value);
        }
      });
      document.head.appendChild(link);
      return link;
    });
    
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'DigitalKhatt';
        src: url('https://github.com/DigitalKhatt/madinafont/raw/main/MadinahMonawwarahRegular.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      .font-arabic {
        font-family: 'DigitalKhatt', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif;
        color: black;
      }
      
      .digitalkhatt-container {
        background-color: #fcfaee;
        padding: 1rem;
        direction: rtl;
        text-align: right;
      }
      
      .verse-container {
        line-height: 2.5;
        text-align: justify;
        text-align-last: center;
      }
      
      .quran-verse {
        margin: 0.25rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s ease;
      }
      
      .verse-start {
        background-color: rgba(5, 150, 105, 0.1);
        border-bottom: 2px solid #059669;
      }

      .verse-end {
        background-color: rgba(220, 38, 38, 0.1);
        border-bottom: 2px solid #DC2626;
      }

      .verse-between {
        background-color: rgba(12, 138, 125, 0.05);
      }
      
      .verse-number {
        font-size: 0.8rem;
        color: #8b573f;
        font-family: 'Amiri', serif;
      }
      
      .mushaf-container {
        background-color: #f8f4d9;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #e2d8b3;
      }
      
      .quran-view {
        margin: 0;
        position: relative;
        background-image: linear-gradient(to bottom, #fcfaee, #f9f5e3);
        background-size: 100% 100%;
        overflow: hidden;
      }
      
      .quran-view::before,
      .quran-view::after {
        content: '';
        position: absolute;
        top: 0;
        width: 12px;
        height: 100%;
        background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05), transparent);
        z-index: 1;
      }
      
      .quran-view::before {
        left: 0;
      }
      
      .quran-view::after {
        right: 0;
        transform: scaleX(-1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      createdLinks.forEach(link => document.head.removeChild(link));
      document.head.removeChild(style);
    };
  }, []);
  
  return <>{children}</>;
};
