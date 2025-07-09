import pandas as pd

def predict_tags(cleaned_texts, model, vectorizer, target_cols):
    X = vectorizer.transform(cleaned_texts)
    preds = model.predict(X)

    tag_lists = []
    for row in preds:
        tags = [tag for tag, val in zip(target_cols, row) if val == 1]
        tag_lists.append(tags)

    return tag_lists
