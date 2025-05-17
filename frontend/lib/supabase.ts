import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to upload a file to Supabase storage
export const uploadVideoToStorage = async (
  file: Blob,
  fileName: string,
  bucketName: string = 'videos'
): Promise<string | null> => {
  try {
    // Ensure user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // If not authenticated, try to sign in anonymously
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw new Error(`Anonymous auth failed: ${error.message}`);
      }
    }

    // Create a unique file path
    const filePath = `${Date.now()}_${fileName}`;
    
    // Check if bucket exists and create it if not
    const { error: bucketError } = await supabase.storage.getBucket(bucketName);
    if (bucketError) {
      console.log('Bucket does not exist, creating it...');
      await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['video/mp4'],
        fileSizeLimit: 100000000 // 100MB
      });
    }
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        upsert: true,
        contentType: 'video/mp4',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Video uploaded successfully:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}; 