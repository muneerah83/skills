import json
import requests
import base64
import io
import os
import time
from PIL import Image
from typing import Optional, Dict, Any, Union, List

class ImageGenClient:
    """Image Generation Client for Gemini multimodal API."""
    def __init__(self, config):
        self.endpoint_url = config.get("base_url") 
        self.api_key = config.get("api_key")
        self.model = config.get("model", "unknown-model")
        self.timeout = config.get("timeout", 300)

    def encode_image(self, image_path: str) -> Optional[str]:
        """Read and encode image to Base64 string."""
        if not image_path or not os.path.exists(image_path):
            return None
            
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            return None
    
    def _get_mime_type(self, image_path: str) -> str:
        """Get MIME type from file extension."""
        ext = os.path.splitext(image_path)[1].lower()
        mime_map = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return mime_map.get(ext, 'image/jpeg')

    def generate(self, prompt: str, output_dir: str, base_images: Optional[List[str]] = None) -> Dict[str, Any]:
        """Call API to generate image and save to specified directory."""
        result = {"image_path": None, "text_content": None}
        
        parts = [{"text": prompt}]
        
        if base_images:
            for img_path in base_images:
                image_b64 = self.encode_image(img_path)
                if image_b64:
                    mime_type = self._get_mime_type(img_path)
                    parts.append({
                        "inline_data": {
                            "mime_type": mime_type, 
                            "data": image_b64
                        }
                    })
        
        payload = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {"aspectRatio": "1:1", "imageSize": "1K"}
            }
        }
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.post(
                self.endpoint_url, 
                headers=headers, 
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                print(f"ImageGen API Error ({response.status_code}): {response.text}")
                return result
                
            return self._process_response(response.json(), prompt, output_dir)
            
        except Exception as e:
            print(f"ImageGen Connection Failed: {e}")
            return result

    def _process_response(self, response_json: dict, prompt: str, output_dir: str) -> Dict[str, Any]:
        """Parse response and extract text and images."""
        result = {"image_path": None, "text_content": None}
        import re

        try:
            candidates = response_json.get("candidates", [])
            if not candidates:
                return result
                
            parts = candidates[0].get("content", {}).get("parts", [])
            
            image_b64 = None
            for part in parts:
                if "inlineData" in part:
                    image_b64 = part["inlineData"]["data"]
                    break
            
            if not image_b64:
                for part in parts:
                    if "text" in part:
                        text = part["text"]
                        match = re.search(r'!\[.*?\]\(data:image/\w+;base64,([A-Za-z0-9+/=]+)\)', text)
                        if match:
                            image_b64 = match.group(1)
                            break
            
            if image_b64:
                image_data = base64.b64decode(image_b64)
                image = Image.open(io.BytesIO(image_data))
                
                safe_prompt = "".join([c for c in prompt[:10] if c.isalnum()])
                timestamp_str = str(int(time.time() * 1000))
                filename = f"gen_{timestamp_str}_{safe_prompt}.png"
                
                abs_filepath = os.path.join(output_dir, filename)
                image.save(abs_filepath)
                result["image_path"] = abs_filepath
            
            text_parts = []
            for part in parts:
                if "text" in part:
                    text = part["text"]
                    cleaned_text = re.sub(r'!\[.*?\]\(data:image/\w+;base64,[A-Za-z0-9+/=]+\)', '[Image Generated]', text)
                    if cleaned_text.strip() and cleaned_text.strip() != '[Image Generated]':
                        text_parts.append(cleaned_text.strip())
            
            if text_parts:
                full_text = "\n".join(text_parts)
                result["text_content"] = full_text

            if not result["image_path"] and not result["text_content"]:
                pass

            return result

        except Exception as e:
            print(f"ImageGen Processing Error: {e}")
            return result
