import { useState, useRef, useEffect, type ButtonHTMLAttributes } from "react";

type ContextButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onRightClick?: () => void;
};

const ContextButton = ({
  children,
  onRightClick,
  onClick,
  className = "",
  ...props
}: ContextButtonProps) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRightClick) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleOpenInNewTab = () => {
    if (onRightClick) {
      onRightClick();
    }
    handleCloseContextMenu();
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  return (
    <>
      <button
        ref={buttonRef}
        className={`context-button ${className}`}
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          handleCloseContextMenu();
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>

      {contextMenu.visible && (
        <div
          className="page-context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleOpenInNewTab}>
            Open in New Tab
          </div>
        </div>
      )}
    </>
  );
};

export default ContextButton;
