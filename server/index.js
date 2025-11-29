import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set up lowdb
const file = join(__dirname, "db.json");
const defaultData = { patients: [], schema: {} };
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

// Read data from db.json
await db.read();

// --- Schema Logic ---

// Recursively merges a patient's structure into the master schema
const mergeIntoSchema = (schemaObject, patient) => {
  let currentSchema = {};
  // Initialize currentSchema safely, handling null/undefined/array inputs for the initial call or recursive calls.
  if (
    schemaObject &&
    typeof schemaObject === "object" &&
    !Array.isArray(schemaObject)
  ) {
    currentSchema = schemaObject;
  }

  for (const key in patient) {
    if (Object.prototype.hasOwnProperty.call(patient, key)) {
      // We don't want to add internal IDs to the schema template
      if (key === "_id" || key === "patient_id") continue;

      const patientValue = patient[key];
      // If it's a nested object, recurse
      if (
        typeof patientValue === "object" &&
        patientValue !== null &&
        !Array.isArray(patientValue)
      ) {
        // Recursively merge and assign the result back to ensure the path is an object
        currentSchema[key] = mergeIntoSchema(currentSchema[key], patientValue);
      } else {
        // If it's a value, just ensure the key exists in the current schema
        // If the key exists but its value is an object (meaning the structure changed to a value), overwrite it.
        // If it doesn't exist, add it with a blank value.
        if (
          typeof currentSchema[key] === "object" ||
          !Object.prototype.hasOwnProperty.call(currentSchema, key)
        ) {
          currentSchema[key] = "";
        }
      }
    }
  }
  return currentSchema;
};

// Initialize Express app
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---

// Get master schema
app.get("/api/schema", (req, res) => {
  res.json(db.data.schema);
});

// Get all patients
app.get("/api/patients", (req, res) => {
  res.json(db.data.patients);
});

// Get a single patient by patient_id
app.get("/api/patients/:patient_id", (req, res) => {
  const patient = db.data.patients.find(
    (p) => p.patient_id === req.params.patient_id,
  );
  if (patient) {
    res.json(patient);
  } else {
    res.status(404).send("Patient not found");
  }
});

// Create or update a patient record
app.post("/api/patients", async (req, res) => {
  const patientData = req.body;
  const { patients } = db.data;

  // Simple validation
  if (!patientData.patient_id) {
    return res.status(400).json({ error: "patient_id is required" });
  }

  const existingPatientIndex = patients.findIndex(
    (p) => p.patient_id === patientData.patient_id,
  );

  if (existingPatientIndex !== -1) {
    // Update existing patient
    patients[existingPatientIndex] = patientData;
  } else {
    // Add new patient
    patients.push(patientData);
  }

  // Update the master schema with any new fields from this patient
  db.data.schema = mergeIntoSchema(db.data.schema, patientData);

  await db.write();
  res.status(200).json(patientData);
});

// --- Suggestion and Frequency Logic ---

// Helper function to recursively traverse the patient data and count field usage
const getFieldFrequencies = (obj, path = "", frequencies = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPath = path ? `${path}.${key}` : key;
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        getFieldFrequencies(obj[key], newPath, frequencies);
      }
      if (!frequencies[newPath]) {
        frequencies[newPath] = 0;
      }
      frequencies[newPath]++;
    }
  }
  return frequencies;
};

// Helper function to recursively traverse and get value frequencies
const getValueFrequencies = (obj, frequencies = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        getValueFrequencies(value, frequencies);
      } else if (typeof value !== "object") {
        const valueStr = String(value);
        if (!frequencies[key]) {
          frequencies[key] = {};
        }
        if (!frequencies[key][valueStr]) {
          frequencies[key][valueStr] = 0;
        }
        frequencies[key][valueStr]++;
      }
    }
  }
  return frequencies;
};

// Get suggestions for a specific field
app.get("/api/suggestions", (req, res) => {
  const { patients } = db.data;
  const valueFrequencies = {};
  const fieldFrequencies = {};

  patients.forEach((patient) => {
    getValueFrequencies(patient, valueFrequencies);
    getFieldFrequencies(patient, "", fieldFrequencies);
  });

  const suggestions = {};
  for (const field in valueFrequencies) {
    suggestions[field] = Object.entries(valueFrequencies[field])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([value]) => value);
  }

  const sortedFields = Object.entries(fieldFrequencies)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  res.json({
    suggestions,
    sortedFields,
    fieldFrequencies,
    matchCount: patients.length,
  });
});

// Helper: Extract actual value from _meta format or return as-is
const extractValue = (data) => {
  if (!data || typeof data !== "object") return data;
  return data.value !== undefined ? data.value : data;
};

// Helper: Check if a field should be ignored
const shouldIgnoreField = (key) => {
  return [
    "_id",
    "patient_id",
    "file_number",
    "national_code",
    "_meta",
  ].includes(key);
};

// Helper: Check if value is empty
const isEmpty = (value) => {
  return value === "" || value === null || value === undefined;
};

// Helper: Check if value is a non-leaf object (has nested structure)
const isNestedObject = (value) => {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.value === undefined
  );
};

// Recursively check if patient matches all filter criteria
const matchesFilter = (patientData, filterData) => {
  for (const key in filterData) {
    if (shouldIgnoreField(key)) continue;

    const filterValue = extractValue(filterData[key]);
    const patientValue = patientData[key];

    // Skip empty filter values
    if (isEmpty(filterValue)) continue;

    // Handle nested objects recursively
    if (isNestedObject(filterValue)) {
      if (!isNestedObject(patientValue)) return false;
      if (!matchesFilter(patientValue, filterValue)) return false;
      continue;
    }

    // Compare leaf values
    if (patientValue !== filterValue) return false;
  }
  return true;
};

// Helper: Get top N suggestions from frequency map
const getTopSuggestions = (frequencyMap, count = 4) => {
  if (!frequencyMap) return [];
  return Object.entries(frequencyMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([value]) => value);
};

// Helper: Backfill suggestions with global data if needed
const backfillSuggestions = (filtered, global, targetCount = 4) => {
  if (filtered.length >= targetCount) return filtered;

  const globalSuggestions = global.filter((value) => !filtered.includes(value));
  const needed = targetCount - filtered.length;
  return [...filtered, ...globalSuggestions.slice(0, needed)];
};

// Get filtered suggestions based on current patient data context
app.post("/api/suggestions/filtered", (req, res) => {
  const { patients } = db.data;
  const filterData = req.body;

  // Filter patients based on matching fields
  const matchingPatients = patients.filter((patient) =>
    matchesFilter(patient, filterData),
  );

  // If no matching patients, return empty results
  if (matchingPatients.length === 0) {
    return res.json({
      suggestions: {},
      sortedFields: [],
      fieldFrequencies: {},
      matchCount: 0,
    });
  }

  // Calculate frequencies from filtered patients
  const filteredValueFrequencies = {};
  const fieldFrequencies = {};
  matchingPatients.forEach((patient) => {
    getValueFrequencies(patient, filteredValueFrequencies);
    getFieldFrequencies(patient, "", fieldFrequencies);
  });

  // Calculate global frequencies for backfilling
  const globalValueFrequencies = {};
  patients.forEach((patient) => {
    getValueFrequencies(patient, globalValueFrequencies);
  });

  // Build suggestions with backfill
  const suggestions = {};
  const allFields = new Set([
    ...Object.keys(filteredValueFrequencies),
    ...Object.keys(globalValueFrequencies),
  ]);

  allFields.forEach((field) => {
    const filteredSuggestions = getTopSuggestions(filteredValueFrequencies[field], 4);
    const globalSuggestions = getTopSuggestions(globalValueFrequencies[field], 4);
    suggestions[field] = backfillSuggestions(filteredSuggestions, globalSuggestions, 4);
  });

  const sortedFields = Object.entries(fieldFrequencies)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  res.json({
    suggestions,
    sortedFields,
    fieldFrequencies,
    matchCount: matchingPatients.length,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
