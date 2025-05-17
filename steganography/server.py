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

def decode_video(video_path, temp_dir):
    """Decode hidden text from video"""
    # Create a temporary directory
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    # Extract frames using OpenCV directly
    cap = cv2.VideoCapture(video_path)
    number_of_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"[INFO] Video has {number_of_frames} frames")
    
    # Try the first 15 frames for simplicity in this basic version
    frames_to_check = list(range(15))
    
    # Process frames
    decoded = {}
    
    for frame_number in frames_to_check:
        if frame_number >= number_of_frames:
            continue
            
        # Jump to the specific frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        if not ret:
            continue
        
        encoded_frame_file_name = os.path.join(temp_dir, f"{frame_number}-enc.png")
        cv2.imwrite(encoded_frame_file_name, frame)
        
        # Try to decode the frame
        try:
            clear_message = lsb.reveal(encoded_frame_file_name)
            if clear_message:
                decoded[frame_number] = clear_message
                print(f"Frame {frame_number} DECODED: {clear_message}")
        except Exception as e:
            print(f"Error decoding frame {frame_number}: {e}")
    
    # Arrange and decrypt the message
    res = ""
    for fn in sorted(decoded.keys()):
        res += decoded[fn]
    
    if not res:
        return None
    
    try:
        # Try to decrypt the message
        decrypted_message = decrypt_rsa(res)
        return decrypted_message.decode('utf-8')
    except Exception as e:
        print(f"Error decrypting message: {e}")
        return res  # Return the encoded message if decryption fails

# Add decrypt endpoint
@app.route('/decrypt', methods=['POST'])
def decrypt_endpoint():
    """Endpoint to decrypt hidden text from video"""
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
        
        # Decode and decrypt hidden text
        decrypted_text = decode_video(video_path, temp_dir)
        
        if decrypted_text:
            return jsonify({"text": decrypted_text})
        else:
            return jsonify({"error": "No hidden text found in video"}), 404
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up temporary files
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

# Update encode_frames function to add metadata
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
    
    # Save the frame numbers in a special metadata frame
    # This will help with faster decryption
    metadata_frame_path = os.path.join(temp_dir, "metadata.png")
    # Create a simple black image for metadata
    metadata_img = cv2.imread(frames[0])
    cv2.imwrite(metadata_frame_path, metadata_img)
    
    # Save frame numbers as metadata
    metadata_content = ",".join(map(str, frame_numbers))
    metadata_secret = lsb.hide(metadata_frame_path, metadata_content)
    metadata_secret.save(metadata_frame_path)
    print(f"[INFO] Metadata frame holds frame numbers: {metadata_content}")
    
    # Insert the metadata frame as the last frame to process
    frames.append(metadata_frame_path)
        
    return frame_numbers

# Update decode_video to look for metadata frame
def decode_video(video_path, temp_dir):
    """Decode hidden text from video"""
    # Create a temporary directory
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    # Extract frames using OpenCV directly
    cap = cv2.VideoCapture(video_path)
    number_of_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"[INFO] Video has {number_of_frames} frames")
    
    # First check if there's a metadata frame by looking at the last frames
    metadata_frame_numbers = []
    
    # Check the last 5 frames for metadata
    print("[INFO] Looking for metadata frame...")
    for frame_index in range(max(0, number_of_frames - 5), number_of_frames):
        # Jump to frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()
        if not ret:
            continue
            
        # Save frame and try to decode it
        metadata_frame_path = os.path.join(temp_dir, f"metadata_check_{frame_index}.png")
        cv2.imwrite(metadata_frame_path, frame)
        
        try:
            metadata_content = lsb.reveal(metadata_frame_path)
            if metadata_content and ',' in metadata_content:
                # This looks like our metadata frame
                print(f"[INFO] Found potential metadata at frame {frame_index}: {metadata_content}")
                try:
                    # Try to parse the frame numbers
                    frame_nums = [int(num) for num in metadata_content.split(',')]
                    metadata_frame_numbers = frame_nums
                    print(f"[INFO] Using frame numbers from metadata: {frame_nums}")
                    break
                except:
                    print(f"[INFO] Failed to parse metadata numbers: {metadata_content}")
        except Exception as e:
            pass
    
    # Reset the video capture
    cap.release()
    cap = cv2.VideoCapture(video_path)
    
    # Frames to check - either from metadata or first 15 frames if no metadata
    frames_to_check = metadata_frame_numbers if metadata_frame_numbers else list(range(15))
    print(f"[INFO] Will check these frames: {frames_to_check}")
    
    # Rest of decode_video function remains the same...
# Add imports
import numpy as np
import colorsys

# Add border encoding functions
def text_to_binary(text):
    """Convert text to binary string"""
    if isinstance(text, str):
        text = text.encode('utf-8')
    return ''.join(format(byte, '08b') for byte in text)

def binary_to_text(binary):
    """Convert binary string to text with basic error handling"""
    if not binary or len(binary) < 8:
        return ""
        
    # Make sure binary string length is a multiple of 8
    binary = binary.ljust((len(binary) // 8 + 1) * 8, '0')
    
    # Group into bytes
    bytes_list = [binary[i:i+8] for i in range(0, len(binary), 8)]
    
    # Convert each byte to a character
    text = ""
    for byte in bytes_list:
        try:
            # Convert binary to integer, then to character
            char_code = int(byte, 2)
            # Only keep printable ASCII characters
            if 32 <= char_code <= 126:
                text += chr(char_code)
        except ValueError:
            pass
    
    return text

def create_data_border(frame, data, frame_index, total_frames, border_width=20):
    """Create border that encodes data in the top-left corner while adding decorative elements elsewhere"""
    # Make a copy to avoid modifying the original
    bordered_frame = frame.copy()
    height, width = bordered_frame.shape[:2]
    
    # Convert data to binary
    binary_data = text_to_binary(data)
    
    # Calculate which portion of the data to encode in this frame
    bits_per_frame = min(len(binary_data), (2 * (width + height) - 4 * border_width) // 2)
    start_index = (frame_index * bits_per_frame // 3) % len(binary_data)  # Overlap by 2/3 for redundancy
    
    # Extract the portion of data for this frame
    frame_data = binary_data[start_index:start_index + bits_per_frame]
    if len(frame_data) < bits_per_frame:
        frame_data += binary_data[:bits_per_frame - len(frame_data)]  # Wrap around
    
    # Generate colors for 0 and 1 bits
    # Use frame index to create subtle color variations between frames
    hue_shift = (frame_index / total_frames) * 0.3  # Shift hue by up to 0.3
    
    # Color for '0' bit - dark blue to purple range
    zero_hue = (0.6 + hue_shift) % 1.0
    zero_color = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(zero_hue, 0.7, 0.4))
    zero_color = (zero_color[2], zero_color[1], zero_color[0])  # Convert to BGR
    
    # Color for '1' bit - orange to red range
    one_hue = (0.05 + hue_shift) % 1.0
    one_color = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(one_hue, 0.9, 0.7))
    one_color = (one_color[2], one_color[1], one_color[0])  # Convert to BGR
    
    # Calculate the corner size
    corner_size = border_width * 2
    
    # KEEP EXISTING TOP-LEFT CORNER ENCODING (DON'T MODIFY THIS PART)
    # Encode data in the top-left corner only
    data_pos = 0
    segment_width = 2  # Each bit takes 2 pixels width
    
    # Top-left corner area
    for y in range(corner_size):
        for x in range(corner_size):
            if data_pos < len(frame_data):
                bit = int(frame_data[data_pos])
                color = one_color if bit else zero_color
                bordered_frame[y, x] = color
                data_pos += 1
    
    # ADD DECORATIVE CORNERS TO THE OTHER THREE CORNERS
    # These won't contain actual data but will help with corner detection
    
    # Top-right corner (decorative)
    tr_color = (30, 180, 30)  # Green
    cv2.rectangle(bordered_frame, (width - corner_size, 0), (width, corner_size), tr_color, -1)
    # Add diagonal lines for a distinctive pattern
    for i in range(0, corner_size, 4):
        cv2.line(bordered_frame, (width - corner_size, i), (width - corner_size + i, 0), (255, 255, 255), 1)
    
    # Bottom-left corner (decorative)
    bl_color = (180, 30, 30)  # Blue
    cv2.rectangle(bordered_frame, (0, height - corner_size), (corner_size, height), bl_color, -1)
    # Add circular pattern
    cv2.circle(bordered_frame, (corner_size // 2, height - corner_size // 2), 
               corner_size // 3, (255, 255, 255), 2)
    
    # Bottom-right corner (decorative)
    br_color = (180, 180, 30)  # Cyan
    cv2.rectangle(bordered_frame, (width - corner_size, height - corner_size), (width, height), br_color, -1)
    # Add square pattern
    cv2.rectangle(bordered_frame, (width - corner_size + 5, height - corner_size + 5), 
                 (width - 5, height - 5), (255, 255, 255), 2)
    
    # ADD TRANSLUCENT DECORATIVE ELEMENTS TO THE REST OF THE BORDER
    # This makes it look like there's data without actually encoding anything
    
    # Create a border overlay for translucent effects
    border_overlay = bordered_frame.copy()
    
    # Top border (excluding corners)
    for x in range(corner_size, width - corner_size, segment_width * 2):
        # Random-looking pattern based on position and frame
        pattern_value = (x + frame_index) % 8  
        if pattern_value < 4:  # Create alternating pattern
            color = (30 + pattern_value * 20, 30 + pattern_value * 10, 150 - pattern_value * 10)
            cv2.rectangle(border_overlay, (x, 0), (x + segment_width * 2 - 1, border_width - 1), color, -1)
    
    # Add decorative elements for other borders...
    # Blend the overlay with the original frame for translucent effect
    alpha = 0.6  # Translucency level (0.0 to 1.0)
    
    # Apply the translucent border overlay to the bordered frame
    # But preserve the top-left corner which contains actual data
    
    # Top border (excluding corners)
    mask = np.zeros_like(bordered_frame, dtype=bool)
    mask[0:border_width, corner_size:width-corner_size] = True
    bordered_frame[mask] = cv2.addWeighted(bordered_frame, 1-alpha, border_overlay, alpha, 0)[mask]
    
    # Apply to other borders...
    
    return bordered_frame

def add_data_border_to_frames(frames, data, temp_dir):
    """Add data-encoding border to all frames"""
    bordered_frames = []
    
    # Set a reasonable border width
    border_width = 20
    
    # Get total frame count
    total_frames = len(frames)
    
    # Prepare the data to encode with STEGO marker
    full_data = f"STEGO:{data}"
    print(f"[INFO] Encoding data")