import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { Exercise, ExerciseType, Lesson } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is injected by the runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, backoff = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;

    const msg = error?.message || JSON.stringify(error);
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    const isServer = msg.includes('500') || msg.includes('503') || msg.includes('INTERNAL') || msg.includes('xhr error') || msg.includes('overloaded');

    if (isQuota || isServer) {
         // If it's a quota error, wait at least 4 seconds (Gemini Free tier is often 15 RPM, i.e., 1 req/4sec)
         const waitTime = isQuota ? Math.max(backoff, 4000) : backoff;
         console.warn(`Gemini API Error (${isQuota ? 'Quota' : 'Server'}). Retrying in ${waitTime}ms...`, msg);
         
         await delay(waitTime);
         // Increase backoff for next attempt
         return callWithRetry(fn, retries - 1, waitTime * 1.5);
    }
    
    throw error;
  }
}

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
  4. LISTEN_AND_TYPE: The user listens to a phrase in ${language} and must type it.
  5. FILL_IN_THE_BLANK: A sentence in ${language} with a missing word represented by "___". The user must type the exact missing word.
  6. CHOOSE_THE_CORRECT_TRANSLATION: The prompt is a sentence in ${language}. Provide 3-4 English sentences as options, one being the correct translation.
  
  Ensure the content is appropriate for the level. Include an IPA pronunciation guide for the correct answer where applicable.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
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
                'LISTEN_AND_TYPE',
                'FILL_IN_THE_BLANK',
                'CHOOSE_THE_CORRECT_TRANSLATION'
              ]},
              prompt: { type: Type.STRING, description: "The question text, sentence to translate, text to be spoken, or sentence with '___' for blank." },
              correctAnswer: { type: Type.STRING, description: "The exact correct answer string" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of words for the word bank or multiple choice options. Must include the correct words and some wrong ones."
              },
              translation: { type: Type.STRING, description: "English translation of the prompt/answer for context" },
              explanation: { type: Type.STRING, description: "Brief grammar or vocabulary explanation for the correct answer." },
              pronunciation: { type: Type.STRING, description: "IPA pronunciation guide for the target text." }
            },
            required: ["id", "type", "prompt", "correctAnswer", "options", "translation", "explanation"]
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "[]");
    return data as Exercise[];
  } catch (error) {
    console.error("Failed to generate lesson:", error);
    // Fallback static data if API fails to ensure app doesn't crash completely
    return [
      {
        id: 1,
        type: ExerciseType.TRANSLATE_TO_TARGET,
        prompt: "Hello (Offline/Fallback)",
        correctAnswer: "Hola",
        options: ["Hola", "Adios", "Gato", "Perro"],
        translation: "Hello",
        explanation: "API Unreachable. 'Hola' is the standard greeting for 'Hello' in Spanish.",
        pronunciation: "/ˈola/"
      },
      {
        id: 2,
        type: ExerciseType.SELECT_MEANING,
        prompt: "Cat",
        correctAnswer: "Gato",
        options: ["Gato", "Perro", "Casa", "Auto"],
        translation: "Gato",
        explanation: "Gato means Cat.",
        pronunciation: "/ˈgato/"
      }
    ];
  }
};

export const generatePracticeContent = async (
  language: string,
  topics: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Exercise[]> => {
  const model = "gemini-3-flash-preview";
  
  // Create a string of topics to focus on
  const topicList = topics.join(", ");

  const prompt = `Create a dynamic practice session with 5 language learning exercises for a ${difficulty} level student learning ${language}.
  The exercises should consist of a random mix of concepts from the following learned topics: ${topicList}.

  The exercises should vary in type:
  1. TRANSLATE_TO_TARGET
  2. TRANSLATE_TO_SOURCE
  3. SELECT_MEANING
  4. LISTEN_AND_TYPE
  5. FILL_IN_THE_BLANK
  6. CHOOSE_THE_CORRECT_TRANSLATION

  Ensure the content is appropriate for the level. Include an IPA pronunciation guide for the correct answer where applicable.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
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
                'LISTEN_AND_TYPE',
                'FILL_IN_THE_BLANK',
                'CHOOSE_THE_CORRECT_TRANSLATION'
              ]},
              prompt: { type: Type.STRING, description: "The question text, sentence to translate, text to be spoken, or sentence with '___' for blank." },
              correctAnswer: { type: Type.STRING, description: "The exact correct answer string" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of words for the word bank or multiple choice options. Must include the correct words and some wrong ones."
              },
              translation: { type: Type.STRING, description: "English translation of the prompt/answer for context" },
              explanation: { type: Type.STRING, description: "Brief grammar or vocabulary explanation for the correct answer." },
              pronunciation: { type: Type.STRING, description: "IPA pronunciation guide for the target text." }
            },
            required: ["id", "type", "prompt", "correctAnswer", "options", "translation", "explanation"]
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "[]");
    return data as Exercise[];
  } catch (error) {
    console.error("Failed to generate practice:", error);
    // Return fallback to prevent app crash
    return [
       {
          id: 1,
          type: ExerciseType.TRANSLATE_TO_TARGET,
          prompt: "Practice (Fallback): Hello",
          correctAnswer: "Hola",
          options: ["Hola", "Adios", "Gato", "Perro"],
          translation: "Hello",
          explanation: "Fallback exercise due to connection error.",
          pronunciation: "/ˈola/"
       },
       {
          id: 2,
          type: ExerciseType.SELECT_MEANING,
          prompt: "Which of these is 'The Cat'?",
          correctAnswer: "El Gato",
          options: ["El Gato", "El Perro", "La Casa", "El Coche"],
          translation: "The Cat",
          explanation: "Gato means Cat.",
          pronunciation: "/el ˈgato/"
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

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
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
    }), 2, 500); // Fewer retries for speech to keep UI responsive

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