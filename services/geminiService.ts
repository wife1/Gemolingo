import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exercise, ExerciseType, Lesson } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is injected by the runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLessonContent = async (
  language: string,
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Exercise[]> => {
  const model = "gemini-3-flash-preview";

  const prompt = `Create a list of 5 language learning exercises for a ${difficulty} level student learning ${language}. The topic is "${topic}".
  
  The exercises should vary in type:
  1. TRANSLATE_TO_TARGET: Translate English to ${language}. Provide a "word bank" of options including distractors.
  2. TRANSLATE_TO_SOURCE: Translate ${language} to English. Provide a "word bank".
  3. SELECT_MEANING: Simple multiple choice for vocabulary.
  
  Ensure the content is appropriate for the level.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              type: { type: Type.STRING, enum: [
                'TRANSLATE_TO_TARGET',
                'TRANSLATE_TO_SOURCE',
                'SELECT_MEANING',
                'LISTEN_AND_TYPE'
              ]},
              prompt: { type: Type.STRING, description: "The question or sentence to work with" },
              correctAnswer: { type: Type.STRING, description: "The exact correct answer string" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of words for the word bank or multiple choice options. Must include the correct words and some wrong ones."
              },
              translation: { type: Type.STRING, description: "English translation of the prompt/answer for context" },
              explanation: { type: Type.STRING, description: "Brief grammar or vocabulary explanation for the correct answer to help the student learn." }
            },
            required: ["id", "type", "prompt", "correctAnswer", "options", "translation", "explanation"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data as Exercise[];
  } catch (error) {
    console.error("Failed to generate lesson:", error);
    // Fallback static data if API fails to ensure app doesn't crash completely
    return [
      {
        id: 1,
        type: ExerciseType.TRANSLATE_TO_TARGET,
        prompt: "Hello",
        correctAnswer: "Hola",
        options: ["Hola", "Adios", "Gato", "Perro"],
        translation: "Hello",
        explanation: "'Hola' is the standard greeting for 'Hello' in Spanish."
      }
    ];
  }
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function decodePCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string, language: string): Promise<AudioBuffer | null> => {
  try {
    // Basic mapping for voice names based on language - imperfect but functional for demo
    let voiceName = 'Puck'; 

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const pcmBytes = decodeBase64(base64Audio);
    return decodePCM(pcmBytes, audioContext, 24000, 1);
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
};