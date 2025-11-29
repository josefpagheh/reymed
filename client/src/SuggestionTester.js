import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3001/api";

const SuggestionTester = () => {
  const [suggestions, setSuggestions] = useState({});
  const [sortedFields, setSortedFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuggestionsAndFields();
  }, []);

  const fetchSuggestionsAndFields = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/suggestions`);
      setSuggestions(response.data.suggestions || {});
      setSortedFields(response.data.sortedFields || []);
    } catch (err) {
      console.error("Error fetching suggestions and sorted fields:", err);
      setError("Failed to fetch suggestions and sorted fields.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", borderTop: "1px solid #eee", marginTop: "30px" }}>
      <h3>Suggestion Tester</h3>
      <button onClick={fetchSuggestionsAndFields} disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh Suggestions"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1, border: "1px solid #ddd", padding: "15px", borderRadius: "5px" }}>
          <h4>Field Suggestions (Top 3 Most Frequent Values)</h4>
          {Object.keys(suggestions).length > 0 ? (
            <ul>
              {Object.entries(suggestions).map(([field, values]) => (
                <li key={field}>
                  <strong>{field}:</strong> {values.join(", ")}
                </li>
              ))}
            </ul>
          ) : (
            <p>No suggestions available. Add some patient data first!</p>
          )}
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", padding: "15px", borderRadius: "5px" }}>
          <h4>Sorted Fields (by overall frequency)</h4>
          {sortedFields.length > 0 ? (
            <ol>
              {sortedFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ol>
          ) : (
            <p>No sorted fields available. Add some patient data first!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionTester;
