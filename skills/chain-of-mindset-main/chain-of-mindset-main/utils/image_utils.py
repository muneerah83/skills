import base64
import os
import mimetypes
from typing import Optional, Tuple

def encode_image_to_base64(image_path: str) -> Optional[str]:
    """Encode a local image file to Base64 string."""
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return None
        
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Failed to encode image {image_path}: {e}")
        return None

def get_image_media_type(image_path: str) -> str:
    """Get MIME type from file extension. Defaults to 'image/jpeg'."""
    mime_type, _ = mimetypes.guess_type(image_path)
    return mime_type if mime_type else "image/jpeg"

def format_image_for_llm(image_path: str) -> Optional[dict]:
    """Format local image for OpenAI-compatible API message format."""
    base64_str = encode_image_to_base64(image_path)
    if not base64_str:
        return None
        
    mime_type = get_image_media_type(image_path)
    
    return {
        "type": "image_url",
        "image_url": {
            "url": f"data:{mime_type};base64,{base64_str}"
        }
    }

def save_base64_image(base64_str: str, output_path: str) -> bool:
    """Save Base64 string as local image file."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
            
        image_data = base64.b64decode(base64_str)
        with open(output_path, "wb") as f:
            f.write(image_data)
        return True
    except Exception as e:
        print(f"Failed to save base64 image to {output_path}: {e}")
        return False
