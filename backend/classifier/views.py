import base64
import io
import json
import re

import httpx
import PIL.Image
from django.conf import settings
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView


MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
MISTRAL_MODEL = 'pixtral-12b-2409'

CLASSIFY_PROMPT = """You are an expert waste classification AI with deep knowledge of recycling and sustainability.
Analyze the image and identify the primary waste item shown.

Respond ONLY with a valid JSON object — no markdown fences, no prose, just raw JSON:
{
  "category": "<exactly one of: Plastic, Paper, Metal, Glass, Organic, Unknown>",
  "confidence": <integer 0-100>,
  "item_name": "<specific descriptive name, e.g. 'PET Plastic Water Bottle'>",
  "tips": [
    "<actionable eco-friendly disposal tip 1>",
    "<actionable eco-friendly disposal tip 2>",
    "<actionable eco-friendly disposal tip 3>"
  ]
}

Rules:
- category MUST be exactly one of: Plastic, Paper, Metal, Glass, Organic, Unknown
- confidence is your certainty as an integer 0–100
- item_name identifies the specific item visible in the image
- tips are specific, actionable instructions for eco-friendly disposal or recycling of this exact item
- If no waste item is clearly visible, use category Unknown with confidence 0 and general tips"""

VALID_CATEGORIES = {'Plastic', 'Paper', 'Metal', 'Glass', 'Organic', 'Unknown'}

FALLBACK_TIPS = [
    'Check your local recycling programme guidelines for this material.',
    'Clean the item before placing it in the correct bin to avoid contamination.',
    'Consider reducing consumption of this material where possible.',
]


def _extract_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r'```(?:json)?\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    return match.group(0) if match else text


def _pil_to_b64_jpeg(img: PIL.Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('utf-8')


class ClassifyView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        if not settings.MISTRAL_API_KEY:
            return Response(
                {'error': 'MISTRAL_API_KEY is not configured. Add it to backend/.env'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'No image provided. Send as multipart/form-data with key "image".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            img = PIL.Image.open(io.BytesIO(image_file.read()))
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            max_dim = 1024
            if max(img.size) > max_dim:
                img.thumbnail((max_dim, max_dim), PIL.Image.LANCZOS)
            b64_image = _pil_to_b64_jpeg(img)
        except Exception as exc:
            return Response(
                {'error': f'Could not read image: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = {
            'model': MISTRAL_MODEL,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image_url',
                            'image_url': {'url': f'data:image/jpeg;base64,{b64_image}'},
                        },
                        {'type': 'text', 'text': CLASSIFY_PROMPT},
                    ],
                }
            ],
        }

        try:
            resp = httpx.post(
                MISTRAL_URL,
                json=payload,
                headers={
                    'Authorization': f'Bearer {settings.MISTRAL_API_KEY}',
                    'Content-Type': 'application/json',
                },
                timeout=60.0,
            )
            resp.raise_for_status()
            raw_text = resp.json()['choices'][0]['message']['content']
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (401, 403):
                return Response(
                    {'error': 'Invalid or expired Mistral API key.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response(
                {'error': f'Mistral API error {exc.response.status_code}: {exc.response.text}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return Response(
                {'error': f'Request to Mistral failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            data = json.loads(_extract_json(raw_text))
        except json.JSONDecodeError:
            return Response(
                {'error': f'AI returned unparseable response: {raw_text[:200]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Sanitise
        if data.get('category') not in VALID_CATEGORIES:
            data['category'] = 'Unknown'
        try:
            data['confidence'] = max(0, min(100, int(data.get('confidence', 0))))
        except (TypeError, ValueError):
            data['confidence'] = 0
        if not isinstance(data.get('tips'), list) or len(data['tips']) < 3:
            data['tips'] = FALLBACK_TIPS
        else:
            data['tips'] = [str(t) for t in data['tips'][:3]]
        if not data.get('item_name'):
            data['item_name'] = f'{data["category"]} Waste'

        return Response(data, status=status.HTTP_200_OK)
