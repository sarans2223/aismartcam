# Sentinel AI - Face Detection & Recognition

A comprehensive face detection and recognition system built with YOLOv8, FastAPI, and React.

## Project Structure

```
sentinel-ai/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── detector.py          # Face detection/recognition logic
│   ├── firebase_config.py   # Firebase integration
│   ├── requirements.txt     # Python dependencies
│   ├── known_faces/         # Directory for reference face images
│   └── models/              
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   ├── components/
│   │   └── styles/
│   ├── package.json
│   └── public/
│
└── training/
    └── train.ipynb         
```

## Features

- **Face Detection**: Real-time face detection using DeepFace and OpenCV
- **Face Recognition**: Identify faces against known person database (using DeepFace embeddings)
- **Firebase Integration**: Cloud database for detection logs
- **Web Interface**: React-based frontend for easy interaction
- **Trainable Model**: Google Colab notebook for model fine-tuning

## Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt     # now includes deepface, face-recognition removed
python main.py
```

The API will be available at `http://localhost:8000`

API Endpoints:
- `GET /health` - Health check
- `POST /detect` - Detect faces in image
- `POST /recognize` - Recognize faces against known database
- `GET /models/status` - Check model status

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

### Model Training

Open `training/train.ipynb` in Google Colab to train YOLOv8 on your custom dataset.

Steps:
1. Upload your dataset to the notebook
2. Configure training parameters
3. Run training cells
4. Download trained weights
5. Place weights in `backend/models/`

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
FIREBASE_CREDENTIALS=path/to/credentials.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Known Faces

Place reference images in `backend/known_faces/` organized by person:

```
known_faces/
├── person_name_1/
│   ├── photo1.jpg
│   └── photo2.jpg
└── person_name_2/
    └── photo1.jpg
```

## Requirements

- Python 3.8+
- Node.js 14+
- GPU (recommended for training)
- Google Colab (for model training)

## Performance

- Detection Model: DeepFace OpenCV
- Inference Speed: ~15-30ms per image (GPU)
- Accuracy: Varies with training data

## Troubleshooting

### Model not loading
- Ensure model weights are in `backend/models/`
- Check model file is not corrupted

### CUDA errors
- Install compatible NVIDIA drivers
- Use CPU mode: set `device=cpu` in config

### Firebase connection issues
- Verify credentials file path
- Check database URL in environment variables

## License

MIT

## Support

For issues and questions, please open an issue on the project repository.
