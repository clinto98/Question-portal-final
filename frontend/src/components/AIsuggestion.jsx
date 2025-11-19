import React from 'react';

export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  ...props
}) => {
  const baseStyles =
    "px-6 py-2.5 rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105";

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    ghost:
      "bg-transparent text-blue-700 font-semibold text-sm hover:bg-blue-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const explanationTabConfig = {
  explanation1: "Explanation 1",
  explanation2: "Explanation 2",
  explanation3: "Explanation 3",
};

export const ExplanationTabs = ({ explanations, activeTab, onTabClick, value, onInputChange }) => {
  if (!explanations) {
    return (
      <textarea
        name="explanation"
        placeholder="Explanation content... or generate one with AI."
        value={value}
        onChange={onInputChange}
        className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-purple-500 transition"
      />
    );
  }

  return (
    <div>
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {Object.keys(explanationTabConfig).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabClick(key)}
              className={`${
                activeTab === key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}
            >
              {explanationTabConfig[key] || key}
            </button>
          ))}
        </nav>
      </div>
      <textarea
        name="explanation"
        placeholder="Explanation content..."
        value={value}
        onChange={onInputChange}
        className="border border-gray-300 px-3 py-2 rounded-md w-full h-40 focus:ring-2 focus:ring-purple-500 transition"
      />
    </div>
  );
};
