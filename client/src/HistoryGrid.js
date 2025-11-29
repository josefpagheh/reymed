import React, { useState } from 'react';

const HistoryGrid = ({ data, onDataChange, suggestions, path }) => {
  const [newItem, setNewItem] = useState("");

  const handleItemClick = (item, list) => {
    const newData = { ...data };
    const otherList = list === 'positive' ? 'negative' : 'positive';

    // Ensure lists exist
    if (!newData.positive) newData.positive = { _meta: {}, value: [] };
    if (!newData.negative) newData.negative = { _meta: {}, value: [] };
    if (!newData.positive.value) newData.positive.value = [];
    if (!newData.negative.value) newData.negative.value = [];


    const itemIndex = newData[list].value.indexOf(item);

    if (itemIndex > -1) {
      // Item exists in the clicked list, so remove it
      newData[list].value.splice(itemIndex, 1);
    } else {
      // Item does not exist in the clicked list, so add it
      newData[list].value.push(item);

      // And remove it from the other list if it exists there
      const otherItemIndex = newData[otherList].value.indexOf(item);
      if (otherItemIndex > -1) {
        newData[otherList].value.splice(otherItemIndex, 1);
      }
    }
    onDataChange(path, newData);
  };

  const [localSuggestions, setLocalSuggestions] = useState(suggestions);

  const handleAddItem = () => {
    if (newItem && !localSuggestions.includes(newItem)) {
      setLocalSuggestions([...localSuggestions, newItem]);
    }
    setNewItem("");
  };


  const renderButton = (item) => {
    const isPositive = data.positive && data.positive.value && data.positive.value.includes(item);
    const isNegative = data.negative && data.negative.value && data.negative.value.includes(item);

    let className = "history-button";
    if (isPositive) className += " positive";
    if (isNegative) className += " negative";

    return (
      <div key={item} className={className}>
        <div className="button-text">{item}</div>
        <div className="button-split">
          <div className="button-half positive-half" onClick={() => handleItemClick(item, 'positive')}></div>
          <div className="button-half negative-half" onClick={() => handleItemClick(item, 'negative')}></div>
        </div>
      </div>
    );
  };

  const allItems = [...new Set([...(localSuggestions || []), ...(data.positive?.value || []), ...(data.negative?.value || [])])];

  return (
    <div className="history-grid">
      <div className="history-buttons-container">
        {allItems.map(renderButton)}
      </div>
      <div className="add-item-container">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item..."
        />
        <button onClick={handleAddItem}>Add</button>
      </div>
    </div>
  );
};

export default HistoryGrid;