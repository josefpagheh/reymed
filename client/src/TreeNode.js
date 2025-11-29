import React, { useState } from 'react';
import LabGrid from './LabGrid';
import HistoryGrid from './HistoryGrid';

const TreeNode = ({
  data,
  path,
  onDataChange,
  suggestions,
  sortedFields,
  fieldFrequencies,
  matchCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSortedKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    const allKeys = Object.keys(obj).filter((key) => key !== '_meta');
    return allKeys.sort((a, b) => {
      const pathA = path ? `${path}.${a}` : a;
      const pathB = path ? `${path}.${b}` : b;
      const aIndex = sortedFields.indexOf(pathA);
      const bIndex = sortedFields.indexOf(pathB);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const sortedKeys = getSortedKeys(data);

  const handleValueChange = (key, val) => {
    const newData = { ...data };
    const isEmpty = val === '';
    const updatedItem = { ...newData[key], value: val };
    if (!updatedItem._meta.manuallyToggled) {
      updatedItem._meta.checked = !isEmpty;
    }
    newData[key] = updatedItem;
    onDataChange(path, newData);
  };

  const handleCheckboxChange = (key) => {
    const newData = { ...data };
    const currentItem = newData[key];
    const newCheckedState = !currentItem._meta.checked;
    newData[key] = {
      ...currentItem,
      _meta: {
        ...currentItem._meta,
        checked: newCheckedState,
        manuallyToggled: true,
      },
    };
    onDataChange(path, newData);
  };

  const getFillPercentage = (fieldPath) => {
    if (matchCount === 0) return 0;
    const freq = fieldFrequencies[fieldPath] || 0;
    return (freq / matchCount) * 100;
  };

  const threshold = 15;
  const visibleKeys = isExpanded ? sortedKeys : sortedKeys.filter(key => {
    if (key === '_id' || key === 'patient_id') return true;
    if (!path) return true;
    const currentPath = path ? `${path}.${key}` : key;
    const fillPercent = getFillPercentage(currentPath);
    return fillPercent >= threshold;
  });

  return (
    <div className="tree-node">
      {path && sortedKeys.length > visibleKeys.length && (
        <button onClick={() => setIsExpanded(!isExpanded)} className="toggle-low-freq">
          {isExpanded ? 'Show Less' : `Show ${sortedKeys.length - visibleKeys.length} More`}
        </button>
      )}
      {visibleKeys.map((key) => {
        if (key === '_id' || key === 'patient_id') {
          return null;
        }
        const item = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        const fieldSuggestions = suggestions[key] || [];
        const frequency = fieldFrequencies[currentPath] || 0;
        const isLeaf = item && item.hasOwnProperty('value');
        const isChecked = isLeaf ? (item?._meta?.checked ?? false) : false;
        const isTopLevelNode = path === '';
        const itemClassName = isTopLevelNode ? 'tree-item top-level-item' : 'tree-item';

        return (
          <div key={currentPath} className={itemClassName}>
            <span className="key">{key} ({frequency}):</span>
            {isLeaf ? (
              <div className="value-container">
                <div className="suggestion-buttons">
                  {fieldSuggestions.map((suggestion, i) => {
                    const isSelected = item?.value === suggestion;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`suggestion-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            handleValueChange(key, '');
                          } else {
                            handleValueChange(key, suggestion);
                          }
                        }}
                        title={suggestion}
                      >
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={item?.value ?? ''}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder="Enter custom value..."
                />
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(key)}
                  className="item-checkbox"
                />
              </div>
            ) : key === 'lab' ? (
              <LabGrid
                data={item}
                path={currentPath}
                onDataChange={onDataChange}
                suggestions={suggestions}
              />
            ) : ['pmh', 'dh', 'sh'].includes(key) ? (
              <HistoryGrid
                data={item}
                path={currentPath}
                onDataChange={onDataChange}
                suggestions={suggestions[key] || []}
              />
            ) : (
              <TreeNode
                data={item}
                path={currentPath}
                onDataChange={onDataChange}
                suggestions={suggestions}
                sortedFields={sortedFields}
                fieldFrequencies={fieldFrequencies}
                matchCount={matchCount}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TreeNode;
