import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
  hideScrollbarWhenInactive?: boolean;
  tabIndex?: number;
  ariaLabel?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className = '',
  maxHeight = '100%',
  hideScrollbarWhenInactive = false,
  tabIndex = 0,
  ariaLabel,
  onScroll
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    // Initial check
    checkScrollable();

    // Set up resize observer to check when content changes
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [children]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isScrollable) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollStep = 40; // Pixels to scroll per key press

    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        containerRef.current.scrollTop = Math.min(
          scrollTop + (e.key === 'PageDown' ? clientHeight : scrollStep),
          scrollHeight - clientHeight
        );
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        containerRef.current.scrollTop = Math.max(
          scrollTop - (e.key === 'PageUp' ? clientHeight : scrollStep),
          0
        );
        break;
      case 'Home':
        e.preventDefault();
        containerRef.current.scrollTop = 0;
        break;
      case 'End':
        e.preventDefault();
        containerRef.current.scrollTop = scrollHeight - clientHeight;
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`scrollable-container ${hideScrollbarWhenInactive ? 'hide-scrollbar-when-inactive' : ''} ${className}`}
      style={{ maxHeight }}
      tabIndex={isScrollable ? tabIndex : undefined}
      role={isScrollable ? 'region' : undefined}
      aria-label={ariaLabel || 'Scrollable content'}
      onKeyDown={handleKeyDown}
      onScroll={onScroll}
    >
      <div className="scrollable-content">
        {children}
      </div>
    </div>
  );
};

export default ScrollableContainer;