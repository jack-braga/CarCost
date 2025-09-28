import easyocr
import json
import os

reader = easyocr.Reader(['en'])

def group_lines(results, y_threshold=15):
    """Assign line_id based on y-coordinate proximity."""
    line_id = []
    current_line = 0
    prev_y = None
    for _, coords, _ in results:
        y = (coords[0][1] + coords[2][1]) / 2  # avg y of box
        if prev_y is not None and abs(y - prev_y) > y_threshold:
            current_line += 1
        line_id.append(current_line)
        prev_y = y
    return line_id

def process_receipt(image_path, receipt_id):
    results = reader.readtext(image_path)  # (bbox, text, conf)
    
    words, bboxes, labels = [], [], []
    for (bbox, text, conf) in results:
        x1, y1 = bbox[0]
        x2, y2 = bbox[2]
        words.append(text)
        bboxes.append([int(x1), int(y1), int(x2), int(y2)])
        labels.append("O")  # default label before annotation
    
    line_id = group_lines(results)

    return {
        "id": receipt_id,
        "words": words,
        "bboxes": bboxes,
        "line_id": line_id,
        "labels": labels
    }

def main(images_folder, output_file):
    dataset = []
    for i, filename in enumerate(os.listdir(images_folder)):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(images_folder, filename)
            data = process_receipt(image_path, f"receipt_{i:04d}")
            dataset.append(data)
    
    # Save in JSONL format (one JSON per line) for Doccano
    with open(output_file, "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry) + "\n")

if __name__ == "__main__":
    main("./receipts", "receipts_for_doccano.jsonl")
