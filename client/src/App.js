import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import SuggestionTester from "./SuggestionTester"; // Import the new component
import TreeNode from './TreeNode'; // Import the TreeNode component

// Helper function to recursively prepare schema fields with _meta.checked
const prepareSchemaForNewPatient = (schema, sortedFields, currentPath = "") => {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  const sortedKeys = Object.keys(schema).sort((a, b) => {
    const pathA = currentPath ? `${currentPath}.${a}` : a;
    const pathB = currentPath ? `${currentPath}.${b}` : b;

    const indexA = sortedFields.indexOf(pathA);
    const indexB = sortedFields.indexOf(pathB);

    if (indexA === -1 && indexB === -1) return 0; // Both not found, maintain original relative order
    if (indexA === -1) return 1; // A not found, B comes first
    if (indexB === -1) return -1; // B not found, A comes first
    return indexA - indexB; // Sort by index
  });

  const preparedSchema = {};
  for (const key of sortedKeys) {
    if (key === "_id" || key === "patient_id") continue; // Skip internal fields

    const value = schema[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // For parent objects, _meta will not have 'checked' property, as it's derived
      preparedSchema[key] = {
        _meta: { manuallyToggled: false },
        ...prepareSchemaForNewPatient(value, sortedFields, newPath),
      };
    } else {
      // For leaf nodes, default to unticked
      preparedSchema[key] = {
        _meta: { checked: false, manuallyToggled: false },
        value: value === undefined ? "" : value, // Ensure value is defined, default to ""
      };
    }
  }
  return preparedSchema;
};

// Helper function to recursively prepare existing patient data with _meta
const prepareExistingPatientData = (data, sortedFields, currentPath = "") => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const sortedKeys = Object.keys(data).sort((a, b) => {
    const pathA = currentPath ? `${currentPath}.${a}` : a;
    const pathB = currentPath ? `${currentPath}.${b}` : b;

    const indexA = sortedFields.indexOf(pathA);
    const indexB = sortedFields.indexOf(pathB);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const preparedData = {};
  for (const key of sortedKeys) {
    if (key === "_id" || key === "patient_id") {
      preparedData[key] = data[key];
      continue;
    }

    const value = data[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    // Check if it's already in the _meta format
    if (value && typeof value === "object" && value._meta) {
      // If it's already formatted, just ensure manuallyToggled is present
      if (value.hasOwnProperty("value")) {
        // It's a primitive wrapper
        preparedData[key] = {
          ...value,
          _meta: {
            ...value._meta,
            checked: value._meta.checked ?? false,
            manuallyToggled: value._meta.manuallyToggled ?? false,
          },
          value: value.value ?? "",
        };
      } else {
        // It's a nested object
        preparedData[key] = {
          ...value,
          _meta: {
            ...value._meta,
            manuallyToggled: value._meta.manuallyToggled ?? false,
          }, // No 'checked' for parent objects here
          ...prepareExistingPatientData(value, sortedFields, newPath),
        };
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // It's a raw object, convert it. Parent objects don't get 'checked' property in _meta
      preparedData[key] = {
        _meta: { manuallyToggled: false },
        ...prepareExistingPatientData(value, sortedFields, newPath),
      };
    } else {
      // It's a raw primitive value, convert it. Checked if it has a non-empty value.
      const hasValue = value !== "" && value !== null && value !== undefined;
      preparedData[key] = {
        _meta: { checked: hasValue, manuallyToggled: false },
        value: value ?? "",
      };
    }
  }
  return preparedData;
};

// Helper function to recursively filter and format data for saving
const filterAndFormatPatientData = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const formattedData = {};
  let containsCheckedChildren = false; // Flag to determine if this object should be kept

  for (const key in data) {
    if (key === "_id" || key === "patient_id") {
      formattedData[key] = data[key]; // Always include _id and patient_id
      continue;
    }
    if (key === "_meta") continue; // Skip metadata when saving

    const item = data[key];
    if (!item || typeof item !== "object" || !item._meta) {
      // If an item isn't in the expected _meta format, ignore it for saving
      continue;
    }

    const isLeaf = item.hasOwnProperty("value");

    if (['pmh', 'dh', 'sh'].includes(key)) {
      const positiveValues = item.positive && item.positive.value ? item.positive.value : [];
      const negativeValues = item.negative && item.negative.value ? item.negative.value : [];

      if (positiveValues.length > 0 || negativeValues.length > 0) {
        formattedData[key] = {
          positive: positiveValues,
          negative: negativeValues,
        };
        containsCheckedChildren = true;
      }
    } else if (isLeaf) {
      const isChecked = item._meta.checked;
      const value = item.value;
      if (isChecked && value !== "" && value !== null && value !== undefined) {
        formattedData[key] = value;
        containsCheckedChildren = true;
      }
    } else {
      // It's an object (parent node)
      const nestedValue = filterAndFormatPatientData(item);
      if (nestedValue && Object.keys(nestedValue).length > 0) {
        formattedData[key] = nestedValue;
        containsCheckedChildren = true;
      }
    }
  }

  // If this object is not the root and contains no checked children, it should be ignored.
  // The root object will always be returned (potentially empty if only _id and patient_id remain)
  if (Object.keys(formattedData).length === 0) {
    // If it's completely empty after filtering
    return null; // Signal to parent to ignore this branch
  } else if (
    !containsCheckedChildren &&
    !formattedData._id &&
    !formattedData.patient_id
  ) {
    // If it's a non-root object and contains no checked children, and doesn't hold top-level IDs
    return null;
  }

  return formattedData;
};

// --- Main App Component ---

function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [masterSchema, setMasterSchema] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [fieldFrequencies, setFieldFrequencies] = useState({});
  const [sortedFields, setSortedFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [showAllFields, setShowAllFields] = useState({}); // Lifted state for show all fields
  const API_URL = "http://localhost:3001/api";
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for 'Enter', 'Shift', or 'Control' keys
      if (
        event.key === "Enter" ||
        event.key === "Shift" ||
        event.key === "Control"
      ) {
        event.preventDefault(); // Stop the default action

        // Get all focusable elements
        const focusableElements = Array.from(
          document.querySelectorAll('input:not([type="checkbox"]), textarea'),
        );
        const currentIndex = focusableElements.indexOf(document.activeElement);

        // Calculate the next index
        let nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = 0; // Loop around to the start
        }

        // Focus the next element
        focusableElements[nextIndex]?.focus();
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array ensures this effect runs only once

  // --- Data Fetching Effects ---
  useEffect(() => {
    fetchPatients();
    fetchSuggestions();
    fetchSchema();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients`);
      setPatients(
        response.data.map((p) => ({ patient_id: p.patient_id, _id: p._id })),
      );
      setMatchCount(response.data.length);
      console.log("matchCount state set to1:", response.data.length || 0);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };
  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/suggestions`);
      setSuggestions(response.data.suggestions || {});
      setSortedFields(response.data.sortedFields || []);
      setFieldFrequencies(response.data.fieldFrequencies || {});
      setMatchCount(response.data.matchCount || 0);
      console.log("matchCount state set to2:", response.data.matchCount || 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchSchema = async () => {
    try {
      const response = await axios.get(`${API_URL}/schema`);
      setMasterSchema(response.data || {});
    } catch (error) {
      console.error("Error fetching schema:", error);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    if (!patientId) {
      setSelectedPatient(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/patients/${patientId}`);
      // Prepare existing patient data to include _meta for checkboxes
      const patientDataWithMeta = prepareExistingPatientData(
        response.data,
        sortedFields,
        "",
      );
      setSelectedPatient(patientDataWithMeta);
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Event Handlers ---
  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    fetchPatientDetails(patientId);
  };

  const handleCreateNewPatient = () => {
    const newPatientId = `P-${String(patients.length + 1).padStart(3, "0")}`;
    const newPatient = {
      _id: `patient_${Date.now()}`,
      patient_id: newPatientId,
      ...prepareSchemaForNewPatient(masterSchema, sortedFields),
    };
    setSelectedPatient(newPatient);
  };

  const handleDataChange = (path, newSubObject) => {
    setSelectedPatient((currentPatient) => {
      const newPatient = JSON.parse(JSON.stringify(currentPatient));
      if (path === "") {
        return newSubObject;
      }

      const keys = path.split(".");
      let current = newPatient;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = newSubObject;
      return newPatient;
    });
  };

  const handleSave = async () => {
    if (!selectedPatient) return;

    // Filter and format the data before sending
    const patientDataToSave = filterAndFormatPatientData(selectedPatient);

    // If the filtered data is null or contains only _id and patient_id, show alert
    if (
      !patientDataToSave ||
      (Object.keys(patientDataToSave).length === 2 &&
        patientDataToSave._id &&
        patientDataToSave.patient_id)
    ) {
      alert("No valid data (checked and non-empty fields) to save.");
      return;
    }

    try {
      await axios.post(`${API_URL}/patients`, patientDataToSave);
      alert("Patient data saved!");
      // Refresh all data to reflect the latest changes
      fetchPatients();
      fetchSuggestions();
      fetchSchema();
      // After saving, re-fetch details of the current patient to ensure UI reflects filtered data correctly
      fetchPatientDetails(selectedPatient.patient_id);
    } catch (error) {
      console.error("Error saving patient data:", error);
      alert("Failed to save patient data.");
    }
  };

  const handleReorder = async () => {
    if (!selectedPatient) return;

    try {
      // Prepare current patient data for filtering (convert from _meta format to plain data)
      const filterData = filterAndFormatPatientData(selectedPatient);
      // Fetch filtered suggestions based on current patient data context
      const response = await axios.post(
        `${API_URL}/suggestions/filtered`,
        filterData,
      );
      const newSortedFields = response.data.sortedFields || [];
      const newSuggestions = response.data.suggestions || {};
      const newFieldFrequencies = response.data.fieldFrequencies || {};
      const matchCount = response.data.matchCount || 0;

      if (matchCount === 0) {
        alert(
          "No matching patients found for context-aware reordering. Using global frequency.",
        );
        // Fallback to global suggestions
        const globalResponse = await axios.get(`${API_URL}/suggestions`);
        setSuggestions(globalResponse.data.suggestions || {});
        setSortedFields(globalResponse.data.sortedFields || []);
        setFieldFrequencies(globalResponse.data.fieldFrequencies || {});
      } else {
        // Update state with new filtered data
        setSuggestions(newSuggestions);
        setSortedFields(newSortedFields);
        setFieldFrequencies(newFieldFrequencies);
        setMatchCount(matchCount);
        console.log("matchCount state set to3:", matchCount);
      }

      // Recursively reorder the current patient's data
      const reorderData = (data, currentPath = "") => {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          return data;
        }

        const keys = Object.keys(data).filter((key) => key !== "_meta");

        // Sort keys based on new frequency data
        const sortedKeys = keys.sort((a, b) => {
          // Don't sort _id, patient_id, file_number, national_code - keep them at top
          if (
            a === "_id" ||
            a === "patient_id" ||
            a === "file_number" ||
            a === "national_code"
          )
            return -1;
          if (
            b === "_id" ||
            b === "patient_id" ||
            b === "file_number" ||
            b === "national_code"
          )
            return 1;

          const pathA = currentPath ? `${currentPath}.${a}` : a;
          const pathB = currentPath ? `${currentPath}.${b}` : b;

          const indexA = newSortedFields.indexOf(pathA);
          const indexB = newSortedFields.indexOf(pathB);

          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        const reorderedData = {};

        // Add _meta first if it exists
        if (data._meta) {
          reorderedData._meta = data._meta;
        }

        // Add other keys in sorted order
        for (const key of sortedKeys) {
          const value = data[key];
          const newPath = currentPath ? `${currentPath}.${key}` : key;

          if (
            value &&
            typeof value === "object" &&
            !value.hasOwnProperty("value")
          ) {
            // It's a nested object, recurse
            reorderedData[key] = reorderData(value, newPath);
          } else {
            // It's a leaf node, copy as is
            reorderedData[key] = value;
          }
        }

        return reorderedData;
      };

      const reorderedPatient = reorderData(selectedPatient);
      setSelectedPatient(reorderedPatient);

      if (matchCount > 0) {
        // alert(`Fields reordered based on ${matchCount} matching patient(s)!`);
      }
    } catch (error) {
      console.error("Error reordering fields:", error);
      alert("Failed to reorder fields.");
    }
  };

  // --- Render ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>Patient Data Editor</h1>
      </header>
      <main>
        <div className="patient-selector-group">
          <div className="patient-selector">
            <h2>Select Patient</h2>
            <select
              onChange={handlePatientSelect}
              value={selectedPatient?.patient_id || ""}
            >
              <option value="">-- Select a Patient --</option>
              {patients.map((p) => (
                <option key={p._id} value={p.patient_id}>
                  {p.patient_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <p>Loading patient data...</p>}

        {/* Add New Patient button - always visible */}
        {!selectedPatient && (
          <div className="empty-state">
            <button
              onClick={handleCreateNewPatient}
              className="add-patient-btn-large"
            >
              + Add New Patient
            </button>
          </div>
        )}

        {/* Floating Reorder button */}
        {selectedPatient && (
          <button
            onClick={handleReorder}
            className="floating-reorder-btn"
            title="Reorder fields by frequency"
          >
            ⟳
          </button>
        )}

        {selectedPatient && (
          <div className="editor-container">
            <TreeNode
              data={selectedPatient}
              path=""
              onDataChange={handleDataChange}
              suggestions={suggestions}
              sortedFields={sortedFields}
              fieldFrequencies={fieldFrequencies}
              matchCount={matchCount}
              showAllFields={showAllFields}
              setShowAllFields={setShowAllFields}
            />
            <div className="editor-actions">
              <button onClick={handleSave} className="save-button">
                Save Changes
              </button>
              <button
                onClick={handleCreateNewPatient}
                className="add-patient-btn"
              >
                + Add New Patient
              </button>
            </div>
          </div>
        )}

        {/* Render the SuggestionTester component */}
        {/* <SuggestionTester />*/}
      </main>
    </div>
  );
}

export default App;
