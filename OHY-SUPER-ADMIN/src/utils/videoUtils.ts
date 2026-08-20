/**
 * Video utility functions
 * Handles video validation and compression
 * Note: Browser-based video compression is limited without heavy libraries like FFmpeg.wasm
 * This utility provides basic optimization where possible
 */

/**
 * Compress video file (basic optimization)
 * Note: Full video compression requires server-side processing or FFmpeg.wasm
 * For now, this function returns the original file as browser video compression is complex
 * Videos are already limited to 3MB, so they should be reasonably sized
 * @param file - Video file to compress
 * @param maxSizeMB - Maximum file size in MB (default 1MB for aggressive compression target)
 * @returns Original video file (compression would require server-side processing)
 */
export const compressVideo = async (
  file: File,
  maxSizeMB: number = 1
): Promise<File> => {
  // Maximum file size in bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Check if file already meets size requirement
  if (file.size <= maxSizeBytes) {
    // Return original file if already within limit
    return file;
  }

  // Note: Browser-based video compression is very limited
  // Full video compression typically requires:
  // 1. Server-side processing (recommended)
  // 2. FFmpeg.wasm (heavy library, large bundle size)
  // 3. MediaRecorder API (limited support, may not work for all formats)
  
  // For now, return original file
  // Videos are already validated to be max 3MB, so they're reasonably sized
  // Full compression should be handled server-side for best results
  return file;
};

