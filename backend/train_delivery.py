"""
Sentinel AI — Delivery Agent Classifier Training
Trains MobileNetV2 to detect Swiggy / Zomato / Normal

Folder structure required:
  sentinel-ai/backend/training_data/
    swiggy/   ← 40+ images of Swiggy delivery agents
    zomato/   ← 40+ images of Zomato delivery agents
    normal/   ← 30+ images of normal people / street

Run:  python train_delivery.py
Output: delivery_classifier.h5  (saved in backend/)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# ── Config ────────────────────────────────────────────────────────────────────
DATA_DIR    = "training_data"
MODEL_PATH  = "delivery_classifier.h5"
IMG_SIZE    = 224
BATCH_SIZE  = 16
EPOCHS      = 20
NUM_CLASSES = 3   # swiggy, zomato, normal

print("🚀 Sentinel AI — Delivery Classifier Training")
print(f"📁 Data dir : {DATA_DIR}")
print(f"💾 Output   : {MODEL_PATH}")
print(f"📐 Image size: {IMG_SIZE}x{IMG_SIZE}")
print("-" * 50)

# ── Check training data ───────────────────────────────────────────────────────
classes = ['swiggy', 'zomato', 'normal']
for cls in classes:
    path  = os.path.join(DATA_DIR, cls)
    if not os.path.exists(path):
        print(f"❌ Missing folder: {path}")
        print("   Create it and add images!")
        exit(1)
    count = len([f for f in os.listdir(path)
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    print(f"  📂 {cls}: {count} images")
    if count < 10:
        print(f"  ⚠️  Need at least 10 images in {cls}/")

print("-" * 50)

# ── Data augmentation ─────────────────────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    zoom_range=0.1,
    brightness_range=[0.8, 1.2],
    validation_split=0.2          # 20% for validation
)

train_gen = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    classes=classes
)

val_gen = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    classes=classes
)

print(f"\n✅ Train samples : {train_gen.samples}")
print(f"✅ Val samples   : {val_gen.samples}")
print(f"✅ Classes       : {train_gen.class_indices}")

# ── Build model ───────────────────────────────────────────────────────────────
print("\n⏳ Building MobileNetV2 model...")

base_model = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Freeze base model first
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.3)(x)
output = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(f"✅ Model built — {model.count_params():,} parameters")

# ── Phase 1: Train top layers ─────────────────────────────────────────────────
print("\n📚 Phase 1: Training top layers...")

callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True, verbose=1),
    ModelCheckpoint(MODEL_PATH, save_best_only=True, verbose=1)
]

history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# ── Phase 2: Fine-tune last 30 layers ────────────────────────────────────────
print("\n🔧 Phase 2: Fine-tuning...")

base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10,
    callbacks=callbacks,
    verbose=1
)

# ── Save ──────────────────────────────────────────────────────────────────────
model.save(MODEL_PATH)

# Get final accuracy
val_loss, val_acc = model.evaluate(val_gen, verbose=0)
print(f"\n{'='*50}")
print(f"✅ Training complete!")
print(f"📊 Validation accuracy: {val_acc*100:.1f}%")
print(f"💾 Model saved: {MODEL_PATH}")
print(f"{'='*50}")
print("\nClass mapping:")
for cls, idx in train_gen.class_indices.items():
    print(f"  {idx} → {cls}")
print("\nNow run: uvicorn main:app --reload")
