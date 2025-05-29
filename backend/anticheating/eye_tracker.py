import cv2
import mediapipe as mp
import numpy as np
import time

# Install dependencies with:
# pip install mediapipe opencv-python numpy

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

# Landmark indices
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
LEFT_EYE_CORNER = [33, 133]       # [outer, inner]
RIGHT_EYE_CORNER = [362, 263]    # [inner, outer]
LEFT_EYE_TOP_BOTTOM = [159, 145] # [top, bottom]
RIGHT_EYE_TOP_BOTTOM = [386, 374]

# Thresholds for gaze direction
HORIZ_LEFT_TH = 0.35
HORIZ_RIGHT_TH = 0.65
VERT_UP_TH = 0.35
VERT_DOWN_TH = 0.65


def compute_gaze_ratios(landmarks, w, h):
    # Helper to convert normalized to pixel coords
    def to_px(idx):
        lm = landmarks[idx]
        return np.array([lm.x * w, lm.y * h])

    # Compute center of each iris
    left_iris_pts = np.array([to_px(i) for i in LEFT_IRIS])
    right_iris_pts = np.array([to_px(i) for i in RIGHT_IRIS])
    left_center = left_iris_pts.mean(axis=0)
    right_center = right_iris_pts.mean(axis=0)

    # Eye corners
    left_outer = to_px(LEFT_EYE_CORNER[0])
    left_inner = to_px(LEFT_EYE_CORNER[1])
    right_inner = to_px(RIGHT_EYE_CORNER[0])
    right_outer = to_px(RIGHT_EYE_CORNER[1])

    # Vertical eyelid
    left_top = to_px(LEFT_EYE_TOP_BOTTOM[0])
    left_bottom = to_px(LEFT_EYE_TOP_BOTTOM[1])
    right_top = to_px(RIGHT_EYE_TOP_BOTTOM[0])
    right_bottom = to_px(RIGHT_EYE_TOP_BOTTOM[1])

    # Ratios
    left_ratio_x = (left_center[0] - left_outer[0]) / (left_inner[0] - left_outer[0])
    right_ratio_x = (right_center[0] - right_inner[0]) / (right_outer[0] - right_inner[0])
    left_ratio_y = (left_center[1] - left_top[1]) / (left_bottom[1] - left_top[1])
    right_ratio_y = (right_center[1] - right_top[1]) / (right_bottom[1] - right_top[1])

    return (left_ratio_x + right_ratio_x) / 2, (left_ratio_y + right_ratio_y) / 2


def get_direction(ratio_x, ratio_y):
    # Horizontal
    if ratio_x < HORIZ_LEFT_TH:
        hor = 'Left'
    elif ratio_x > HORIZ_RIGHT_TH:
        hor = 'Right'
    else:
        hor = 'Center'
    # Vertical
    if ratio_y < VERT_UP_TH:
        ver = 'Up'
    elif ratio_y > VERT_DOWN_TH:
        ver = 'Down'
    else:
        ver = 'Center'
    return f"Gaze: {hor}-{ver}"


def main():
    cap = cv2.VideoCapture(0)
    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as face_mesh:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Draw mesh
                    mp_drawing.draw_landmarks(
                        image=frame,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_TESSELATION,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing.DrawingSpec(color=(0,255,0), thickness=1, circle_radius=1)
                    )
                    # Compute gaze
                    rx, ry = compute_gaze_ratios(face_landmarks.landmark, w, h)
                    direction = get_direction(rx, ry)
                    cv2.putText(frame, direction, (30,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
                    print(direction, cv2.FONT_HERSHEY_SIMPLEX)
            cv2.imshow('Eye Gaze Tracker', frame)
            if cv2.waitKey(5) & 0xFF == 27:
                break
    cap.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
