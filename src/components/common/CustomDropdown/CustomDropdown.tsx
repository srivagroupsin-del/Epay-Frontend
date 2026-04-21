import React, { useState, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./CustomDropdown.css";

interface Option {
    id: string | number;
    label: string;
}

interface CustomDropdownProps {
    label: string;
    options: Option[];
    value: string | number;
    onChange: (id: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
    required?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Select an option",
    searchPlaceholder = "Search...",
    disabled = false,
    isOpen,
    onToggle,
    required = false,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Selected option label
    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    // Filtered options based on search
    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close on click outside handled by parent coordinating dropdowns, 
    // but the parent needs to know which one to close. 
    // We'll rely on the parent's logic for "Only one dropdown should be open at a time".

    const handleSelect = (id: string | number) => {
        onChange(id);
        onToggle(); // Close after selection
        setSearchTerm("");
    };

    return (
        <div className={`premium-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
            <label className="dropdown-label">
                {label} {required && <span className="required-star">*</span>}
            </label>

            <div
                className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => !disabled && onToggle()}
            >
                <span className={`trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="chevron-icon"
                >
                    <ChevronDown size={18} />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="dropdown-menu"
                    >
                        <div className="search-wrapper" onClick={(e) => e.stopPropagation()}>
                            <div className="search-icon">
                                <Search size={14} />
                            </div>
                            <input
                                type="text"
                                className="search-input"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="options-list">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={`option-item ${String(opt.id) === String(value) ? 'selected' : ''}`}
                                        onClick={() => handleSelect(opt.id)}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            ) : (
                                <div className="no-options">No results found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDropdown;
