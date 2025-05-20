# TruthCast - Worlds first Steganography Power Social Media

A Lens Client Social media that uses steganography to provide AI proof content

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.8 or higher
- pip (Python package manager)

## Project Structure

- `frontend/` - React frontend application
- `steganography/` - Python backend for steganography operations
- `blockend/` - Blockchain integration backend

## Setup and Running Instructions

### 1. Backend Setup (Steganography Server)

1. Navigate to the steganography directory:

   ```bash
   cd steganography
   ```

2. Create a Python virtual environment:

   ```bash
   # On macOS/Linux
   python3 -m venv venv

   # On Windows
   python -m venv venv
   ```

3. Activate the virtual environment:

   ```bash
   # On macOS/Linux
   source venv/bin/activate

   # On Windows
   .\venv\Scripts\activate
   ```

4. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Start the steganography server:
   ```bash
   python server.py
   ```
   Copy the server url from the console

### 2. Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a copy of the `.env.example` file in the frontend directory and name it `.env` update it with required details and also the server url we copied before

4. Start the frontend development server:
   ```bash
   npm start
   # or
   yarn start
   ```
   The frontend will be available at `http://localhost:3000`

## Troubleshooting

If you encounter any issues:

1. Ensure all servers are running (steganography server on port 5000)
2. Check that the `.env` file has the correct API URL
3. Verify that all dependencies are installed correctly
4. Check the browser console for any frontend errors
5. Check the terminal running the steganography server for any backend errors
6. Contact @romariokavin on telegram (or) email romario7kavin@gmail.com

## Support

For any issues or questions, please open an issue in the repository.
