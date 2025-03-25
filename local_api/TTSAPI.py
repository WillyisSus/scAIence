from gtts import gTTS


class TTS_API:
    def GenerateVoice(self, text: str, path: str, lang: str = "en", slowed: bool = False) -> None:
        sound_object = gTTS(text, lang, slowed)
        sound_object.save(path)
