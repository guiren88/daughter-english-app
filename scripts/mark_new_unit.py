import json
import sys
import os

def set_new_unit(grade_key, unit_name):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    vocab_path = os.path.join(base_dir, "src", "data", "vocabulary.json")
    
    with open(vocab_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Clear isNew flag on all units across all grades
    for g_key, units in data.items():
        if isinstance(units, list):
            for u in units:
                if "isNew" in u:
                    del u["isNew"]

    # 2. Set isNew only on the target unit
    target_units = data.get(grade_key, [])
    found = False
    for u in target_units:
        if u.get("unit") == unit_name:
            u["isNew"] = True
            found = True
            print(f"✅ Successfully marked {grade_key} {u['unit']} ({u.get('title', '')}) as NEW!")
            break

    if not found:
        print(f"⚠️ Unit {unit_name} in {grade_key} not found!")
        return False

    with open(vocab_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/mark_new_unit.py <grade_key, e.g. grade_2a> <unit_name, e.g. 'Unit 2'>")
        sys.exit(1)
    set_new_unit(sys.argv[1], sys.argv[2])
