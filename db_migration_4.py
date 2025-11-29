import json

def migrate_db(input_filepath='server/db.json', output_filepath='server/db_migrated.json'):
    """
    Migrates the patient database to a new schema for pmh, dh, and sh fields.
    """
    try:
        with open(input_filepath, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_filepath}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {input_filepath}")
        return

    patients = data.get('patients', [])
    history_keys = ['pmh', 'dh', 'sh']
    positive_values = ['1', 'positive']
    negative_values = ['0', 'negative']

    for patient in patients:
        for key in history_keys:
            if key in patient and isinstance(patient[key], dict):
                new_history_data = {'positive': [], 'negative': []}
                old_history_data = patient[key]

                for item, value in old_history_data.items():
                    if str(value).lower() in positive_values:
                        new_history_data['positive'].append(item)
                    elif str(value).lower() in negative_values:
                        new_history_data['negative'].append(item)

                patient[key] = new_history_data

    try:
        with open(output_filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Migration successful. Migrated data saved to {output_filepath}")
    except IOError:
        print(f"Error: Could not write to output file {output_filepath}")

if __name__ == '__main__':
    migrate_db()
