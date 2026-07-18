export const STORAGE_CONFIG = {
    BUCKET_NAME: 'videos',
    MAX_FILE_SIZE: 100 * 1024 * 1024 * 1024, // 100 Go (Pas de limite effective)
    ALLOWED_TYPES: [
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ],
    ALLOWED_EXTENSIONS: ['.mp4', '.webm', '.mov'],
    THUMBNAIL_SIZE: {
        width: 320,
        height: 180
    }
};