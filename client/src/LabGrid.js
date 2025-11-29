import React, { useState } from 'react';

const LabGrid = ({ data, path, onDataChange, suggestions }) => {
  const handleValueChange = (key, newValue) => {
    const newLabData = { ...data };
    const currentItem = newLabData[key] && newLabData[key]._meta
      ? { ...newLabData[key] }
      : { _meta: { manuallyToggled: false }, value: "" };

    const updatedItem = { ...currentItem, value: newValue };

    if (!updatedItem._meta.manuallyToggled) {
      updatedItem._meta.checked = newValue !== "" && newValue !== null && newValue !== undefined;
    }

    newLabData[key] = updatedItem;
    onDataChange(path, newLabData);
  };

  const labItems = Object.keys(data).filter(key => key !== '_meta');

  return (
    <div className="lab-grid">
      {labItems.map(key => {
        const item = data[key];
        if (!item || typeof item.value === 'undefined') return null;

        const fieldSuggestions = suggestions[key] || [];
        const showSuggestions = isNaN(parseFloat(item.value)) && item.value !== 'nl' && item.value !== "";

        return (
          <div key={key} className="lab-grid-item">
            <span className="lab-key">{key}</span>
            <div className="lab-value-container">
              <input
                type="text"
                value={item.value || ''}
                onChange={e => handleValueChange(key, e.target.value)}
              />
            </div>
            {showSuggestions && fieldSuggestions.length > 0 && (
              <div className="suggestion-buttons">
                {fieldSuggestions.map((suggestion, i) => (
                   <button
                   key={i}
                   type="button"
                   className={`suggestion-btn ${item?.value === suggestion ? "selected" : ""}`}
                   onClick={() => {
                     if (item?.value === suggestion) {
                        handleValueChange(key, "");
                     } else {
                        handleValueChange(key, suggestion);
                     }
                   }}
                   title={suggestion}
                 >
                   {suggestion}
                 </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LabGrid;