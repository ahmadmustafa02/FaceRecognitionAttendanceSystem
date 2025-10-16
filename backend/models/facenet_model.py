from keras_facenet import FaceNet
import numpy as np
import cv2

embedder = FaceNet()

def get_face_embedding(image):
    # Convert image to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    embeddings = embedder.embeddings([image_rgb])
    return np.array(embeddings[0])
