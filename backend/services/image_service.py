import os
import shutil
import uuid

from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}

# Absolute paths resolved relative to this file's location (backend/services/)
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_DIR = os.path.join(_BACKEND_DIR, 'static', 'images')
DEFAULT_IMAGE_FILENAME = 'DefaultUserImage.jpg'
_DEFAULT_IMAGE_SRC = os.path.join(_BACKEND_DIR, 'model', DEFAULT_IMAGE_FILENAME)


def ensure_default_image():
    """Copy DefaultUserImage.jpg from model/ into static/images/ so Flask can serve it.
    Called once at app startup from app.py.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dest = os.path.join(UPLOAD_DIR, DEFAULT_IMAGE_FILENAME)
    if not os.path.exists(dest) and os.path.exists(_DEFAULT_IMAGE_SRC):
        shutil.copy2(_DEFAULT_IMAGE_SRC, dest)


def get_image_url(filename: str | None) -> str:
    """Return the URL path for an image filename.
    Falls back to DefaultUserImage.jpg when filename is None.
    """
    if filename:
        return f'/static/images/{filename}'
    return f'/static/images/{DEFAULT_IMAGE_FILENAME}'


def save_image(file) -> dict:
    """Validate and save an uploaded image file to static/images/.

    Accepts .jpg, .jpeg, .png only. Generates a UUID-based filename to
    prevent collisions and path traversal attacks.

    Returns:
        {'success': True, 'filename': '<uuid>.<ext>'}
        {'success': False, 'error': '<reason>'}
    """
    if not file or file.filename == '':
        return {'success': False, 'error': 'No file provided'}

    ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            'success': False,
            'error': f'Invalid file type. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}',
        }

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_filename = f'{uuid.uuid4().hex}{ext}'
    file.save(os.path.join(UPLOAD_DIR, unique_filename))
    return {'success': True, 'filename': unique_filename}
