from flask import Flask, request, send_file, jsonify
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configure upload settings
UPLOAD_FOLDER = './uploads'
TEMP_FOLDER = './tmp'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

@app.route('/')
def hello():
    return "Video Steganography API"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    
# Add imports
import cv2
import uuid
import shutil

# Add function
def extract_frames(video_path, temp_dir):
    """Extract frames from video"""
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    print(f"[INFO] Extracting frames from video {video_path}")
    vidcap = cv2.VideoCapture(video_path)
    count = 0
    frames = []
    
    while True:
        success, image = vidcap.read()
        if not success:
            break
        frame_path = os.path.join(temp_dir, f"{count}.png")
        cv2.imwrite(frame_path, image)
        frames.append(frame_path)
        count += 1
    
    print(f"[INFO] Extracted {count} frames from video")
    return frames, count

# Add endpoint
@app.route('/extract', methods=['POST'])
def extract_endpoint():
    """Test endpoint to extract frames from video"""
    if 'video' not in request.files:
        return jsonify({"error": "Missing video file"}), 400
    
    video_file = request.files['video']
    
    if video_file.filename == '':
        return jsonify({"error": "No video selected"}), 400
    
    # Create temporary directory for processing
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_FOLDER, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Save uploaded video
        video_path = os.path.join(temp_dir, secure_filename(video_file.filename))
        video_file.save(video_path)
        
        # Extract frames from video
        frames, count = extract_frames(video_path, temp_dir)
        
        return jsonify({"frames_extracted": count})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as cleanup_error:
            print(f"Error cleaning up: {cleanup_error}")
# Add imports
import math
from stegano import lsb

# Add functions
def split_string(s_str, count=10):
    """Split string into parts"""
    per_c = math.ceil(len(s_str)/count)
    c_cout = 0
    out_str = ''
    split_list = []
    for s in s_str:
        out_str += s
        c_cout += 1
        if c_cout == per_c:
            split_list.append(out_str)
            out_str = ''
            c_cout = 0
    if c_cout != 0:
        split_list.append(out_str)
    return split_list

def encode_frames(frames, encrypted_text, temp_dir):
    """Encode encrypted text into frames"""
    # Convert to string if it's bytes
    if isinstance(encrypted_text, bytes):
        encrypted_text = encrypted_text.decode('utf-8')
        
    # Split the text into parts
    split_text_list = split_string(encrypted_text)
    num_parts = len(split_text_list)
    
    # Use the first N frames (N = number of text parts)
    frame_numbers = list(range(min(num_parts, len(frames))))
    
    print(f"Encoding text into {len(frame_numbers)} frames")
    
    # Hide text parts in frames
    for i, frame_num in enumerate(frame_numbers):
        if i >= len(split_text_list):
            break
            
        frame_path = frames[frame_num]
        # Hide text in frame using LSB steganography
        secret_enc = lsb.hide(frame_path, split_text_list[i])
        secret_enc.save(frame_path)
        print(f"[INFO] Frame {frame_num} holds {split_text_list[i]}")
        
    return frame_numbers

def create_output_video(frames, original_video, output_path):
    """Create output video from frames"""
    # Get video properties
    video = cv2.VideoCapture(original_video)
    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Ensure output path ends with .mov
    if not output_path.endswith('.mov'):
        output_path = output_path.rsplit('.', 1)[0] + '.mov'
    
    # Create video writer with PNG codec for MOV container
    # This preserves image quality better for steganography
    fourcc = cv2.VideoWriter_fourcc(*'png ')  # PNG codec with MOV container
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Add frames to video
    for frame_path in frames:
        frame = cv2.imread(frame_path)
        if frame is not None:
            out.write(frame)
    
    out.release()
    print(f"[INFO] Created output video: {output_path}")
    return output_path

# Add encrypt endpoint
@app.route('/encrypt', methods=['POST'])
def encrypt_endpoint():
    """Endpoint to encrypt text and hide it in video"""
    if 'video' not in request.files or 'text' not in request.form:
        return jsonify({"error": "Missing video file or text"}), 400
    
    video_file = request.files['video']
    text = request.form['text']
    
    if video_file.filename == '':
        return jsonify({"error": "No video selected"}), 400
    
    # Create temporary directory for processing
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_FOLDER, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # Save uploaded video
        video_path = os.path.join(temp_dir, secure_filename(video_file.filename))
        video_file.save(video_path)
        
        # Extract frames from video
        frames, _ = extract_frames(video_path, temp_dir)
        
        # Encrypt the text using RSA
        encrypted_text = encrypt_rsa(text)
        
        # Encode encrypted text into frames
        frame_numbers = encode_frames(frames, encrypted_text, temp_dir)
        
        # Create output video with .mov extension
        original_filename = secure_filename(video_file.filename)
        output_filename = f"encoded_{original_filename.rsplit('.', 1)[0]}.mov"
        output_path = os.path.join(temp_dir, output_filename)
        create_output_video(frames, video_path, output_path)
        
        # Read the file into memory
        with open(output_path, 'rb') as file:
            file_data = file.read()
        
        # Create response with the encoded video file
        response = {
            "video": base64.b64encode(file_data).decode('utf-8'),
            "filename": output_filename
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as cleanup_error:
            print(f"Error cleaning up: {cleanup_error}")