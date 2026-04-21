import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import "./SearchableSelect.css";

type Option = {
    id: string | number;
    label: string;
};

type SearchableSelectProps = {
    options: Option[];
    value: string | number;
    placeholder: string;
    label: string;
    onChange: (value: string | number) => void;
};

const SearchableSelect = ({ options, value, placeholder, label, onChange }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => String(o.id) === String(value));

    // Update search term to match selection when not searching
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(selectedOption ? selectedOption.label : "");
        }
    }, [selectedOption, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => 
        String(o.label).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputClick = () => {
        setIsOpen(true);
        if (selectedOption) {
            setSearchTerm(""); // Clear search when opening to show all options
        }
    };

    return (
        <div className="searchable-select-container" ref={dropdownRef}>
            <label className="searchable-select-label">{label}</label>
            <div className={`searchable-select-wrapper ${isOpen ? "active" : ""}`}>
                {isOpen && (
                    <div className="search-icon-inside">
                        <Search size={16} />
                    </div>
                )}
                <input 
                    type="text" 
                    className="searchable-trigger-input"
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : "")}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onClick={handleInputClick}
                />
                <div className="trigger-actions">
                    {!!value && !isOpen && (
                        <X 
                            size={16} 
                            className="clear-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                                setSearchTerm("");
                            }} 
                        />
                    )}
                    <ChevronDown 
                        size={18} 
                        className={`chevron ${isOpen ? "open" : ""}`} 
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="searchable-select-content">
                    <ul className="options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <li 
                                    key={option.id}
                                    className={`option-item ${String(option.id) === String(value) ? "selected" : ""}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearchTerm(option.label);
                                    }}
                                >
                                    {option.label}
                                </li>
                            ))
                        ) : (
                            <li className="no-options">No matches found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
