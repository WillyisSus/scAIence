from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from PIL import Image
from io import BytesIO


class GeminiAPI:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"
        self.search_tool = Tool(google_search=GoogleSearch())

    def GenerateText(self, prompt: tuple | str) -> list[str]:
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=GenerateContentConfig(
                tools=[self.search_tool],
                response_modalities=["TEXT"],
            )
        )

        return [each.text for each in response.candidates[0].content.parts]

    def GenerateImage(self, prompt: tuple | str, path: str) -> None:
        response = self.client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=prompt,
            config= GenerateContentConfig(
                response_modalities=['Text', 'Image']
            )
        )

        for part in response.candidates[0].content.parts:
            if part.text is not None:
                print(part.text)
            elif part.inline_data is not None:
                image = Image.open(BytesIO(part.inline_data.data))
                image.save(path)
