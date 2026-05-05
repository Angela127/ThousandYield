"""
ThousandYield — Plant Disease Model Training Script
====================================================
Uses MobileNetV2 (transfer learning) on the PlantVillage dataset.
Run once to produce plant_model.h5 and class_names.json.

Usage:
    python ml/train_model.py
"""

import os
import json
import tensorflow as tf

# ─── Configuration ────────────────────────────────────────────────────────────
DATASET_PATH = r"D:\Download\archive\plantvillage dataset\color"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))  # ml/ folder
MODEL_PATH = os.path.join(OUTPUT_DIR, "plant_model.h5")
CLASS_NAMES_PATH = os.path.join(OUTPUT_DIR, "class_names.json")

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 5
VALIDATION_SPLIT = 0.2
SEED = 42


def main():
    print("=" * 60)
    print("ThousandYield — Plant Disease Model Training")
    print("=" * 60)
    print(f"\nDataset path: {DATASET_PATH}")
    print(f"Output dir:   {OUTPUT_DIR}\n")

    # Verify dataset exists
    if not os.path.isdir(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("Please check the path and try again.")
        return

    # ─── Step 1: Load dataset ─────────────────────────────────────────────
    print("Loading training dataset...")
    train_data = tf.keras.utils.image_dataset_from_directory(
        DATASET_PATH,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        validation_split=VALIDATION_SPLIT,
        subset="training",
        seed=SEED,
    )

    print("Loading validation dataset...")
    val_data = tf.keras.utils.image_dataset_from_directory(
        DATASET_PATH,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        validation_split=VALIDATION_SPLIT,
        subset="validation",
        seed=SEED,
    )

    class_names = train_data.class_names
    num_classes = len(class_names)
    print(f"\nFound {num_classes} categories:")
    for i, name in enumerate(class_names):
        print(f"  {i:>2}. {name}")

    # ─── Step 2: Optimize data pipeline ───────────────────────────────────
    AUTOTUNE = tf.data.AUTOTUNE
    train_data = train_data.shuffle(200).prefetch(buffer_size=AUTOTUNE)
    val_data = val_data.prefetch(buffer_size=AUTOTUNE)


    # ─── Step 3: Build model ──────────────────────────────────────────────
    print("\nBuilding model (MobileNetV2 + classification head)...")

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # Freeze base — transfer learning

    # Rescaling: pixel values [0, 255] → [-1, 1] (what MobileNetV2 expects)
    # Using Rescaling instead of Lambda so the model is fully serializable
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(224, 224, 3)),
        tf.keras.layers.Rescaling(1./127.5, offset=-1),
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])


    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    # ─── Step 4: Train ────────────────────────────────────────────────────
    print(f"\nTraining for {EPOCHS} epochs...")
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=EPOCHS,
    )

    # Print final results
    final_acc = history.history["accuracy"][-1]
    final_val_acc = history.history["val_accuracy"][-1]
    print(f"\n{'=' * 60}")
    print(f"Training complete!")
    print(f"  Final training accuracy:   {final_acc:.4f} ({final_acc*100:.1f}%)")
    print(f"  Final validation accuracy: {final_val_acc:.4f} ({final_val_acc*100:.1f}%)")
    print(f"{'=' * 60}")

    # ─── Step 5: Save model and class names ───────────────────────────────
    print(f"\nSaving model to: {MODEL_PATH}")
    model.save(MODEL_PATH)

    print(f"Saving class names to: {CLASS_NAMES_PATH}")
    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

    print(f"\nDone! You can now run the API server with:")
    print(f"  python api/app.py")


if __name__ == "__main__":
    main()
