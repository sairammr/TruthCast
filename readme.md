# TruthCast - Lens Protocol Integration

TruthCast is a video platform that allows users to create and share encrypted videos with hidden messages. This project integrates with Lens Protocol to enable social sharing of videos.

## Features

- Record videos directly in the browser
- Encrypt videos with hidden messages using steganography
- Store encrypted videos in Supabase storage
- Create and manage Lens Protocol profiles
- Post videos to Lens Protocol

## Project Structure

- `frontend/`: Next.js web application
- `steganography/`: Flask server for video encryption
- `blockend/`: Smart contracts for Lens Protocol integration

## Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- Supabase account
- Lens Protocol testnet access

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Server URL for steganography API
   NEXT_PUBLIC_SERVER_URL=http://localhost:5000

   # WalletConnect Project ID (get one from https://cloud.walletconnect.com/)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

   # Supabase configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Lens Protocol configuration
   # Use 'development' for testnet or 'production' for mainnet
   NEXT_PUBLIC_LENS_ENVIRONMENT=development
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Steganography Server Setup

1. Navigate to the steganography directory:
   ```
   cd steganography
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```
   python server.py
   ```

## Supabase Setup

1. Create a new project in Supabase
2. Create a storage bucket named `videos` with public access
3. Copy your project URL and anon key to the `.env.local` file

## Lens Protocol Integration

The application integrates with Lens Protocol to enable:

1. User onboarding with wallet connection
2. Creating Lens Protocol profiles
3. Posting videos to Lens Protocol
4. Viewing Lens Protocol profiles and content

### User Flow

1. Connect wallet using ConnectKit
2. Create a Lens Protocol profile (if you don't have one)
3. Record or upload a video
4. Encrypt the video with a hidden message
5. Post the video to Lens Protocol

## License

This project is part of the Lens Spring Hackathon submission.
