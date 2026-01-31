import { moodMockResponses } from '../data/moodMockResponses';

interface OpenAIMessage {
  content: string;
}

interface OpenAIChoice {
  message: OpenAIMessage;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

export async function fetchGPTResponse(mood: string): Promise<string> {
  const useMock = !import.meta.env.VITE_OPENAI_API_KEY;

  if (useMock) {
    return moodMockResponses[mood] || 'Mach etwas Kleines für dich – es zählt.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein motivierender Coach für Jugendliche. Gib praktische, einfache Skill-Tipps in 1–2 Sätzen.',
          },
          {
            role: 'user',
            content: `Ich fühle mich ${mood}. Was kann ich tun?`,
          },
        ],
        temperature: 0.7,
        max_tokens: 60,
      }),
    });

    const data = (await response.json()) as OpenAIResponse;

    if (!data.choices?.[0]?.message?.content) {
      console.warn('Unvollständige Antwort von GPT:', data);
      return moodMockResponses[mood] || 'Ich konnte gerade keinen Tipp finden.';
    }

    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error('GPT-Fehler:', err);
    return moodMockResponses[mood] || 'Technischer Fehler. Versuch es später nochmal.';
  }
}
