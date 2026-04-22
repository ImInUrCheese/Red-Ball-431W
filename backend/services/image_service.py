import os
import shutil
import uuid

from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}

# Absolute paths resolved relative to this file's location
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UPLOAD_DIR = os.path.join(_BACKEND_DIR, 'static', 'images')
DEFAULT_IMAGE_FILENAME = 'DefaultUserImage.jpg'
_DEFAULT_IMAGE_SRC = os.path.join(_BACKEND_DIR, 'model', DEFAULT_IMAGE_FILENAME)


def ensure_default_image():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    dest = os.path.join(UPLOAD_DIR, DEFAULT_IMAGE_FILENAME)
    if not os.path.exists(dest) and os.path.exists(_DEFAULT_IMAGE_SRC):
        shutil.copy2(_DEFAULT_IMAGE_SRC, dest)


def get_image_url(filename: str | None) -> str:
    if filename:
        return f'/static/images/{filename}'
    return f'/static/images/{DEFAULT_IMAGE_FILENAME}'


def save_image(file) -> dict:
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
