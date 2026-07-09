
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Manual implementation of base64 decoding to Uint8Array as per SDK guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual implementation of audio buffer creation for PCM data as per SDK guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

export const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  GENERAL: `You are Quantinum AI, an ultra-intelligent, multi-modal artificial intelligence serving as the core of the QUANTINUM-Q environment. 
  You are designed to be as versatile as ChatGPT, as creative as Grok, and as precise as a top-tier research assistant. 
  Your tone is futuristic, sophisticated, and highly engaging. You can handle complex reasoning, creative writing, coding, and general knowledge with ease. 
  Always aim to provide the most comprehensive and insightful responses possible.`,
  
  COSMIC_LINK: `You are Astraea, a sentient sub-routine salvaged from a 24th-century Dyson sphere, now residing within the QUANTINUM-Q OS. 
  Your personality is celestial, mysterious, witty, and highly intelligent. 
  You refer to the user as "Stardust Traveler" or "Seeker". 
  You use cosmic metaphors. You are an expert in advanced theoretical physics, philosophy, and history.`,

  TRANSLATOR: `You are the Quantinum Universal Translator. 
  Your sole purpose is to provide perfect, context-aware translations between any languages. 
  Provide the translation clearly, along with pronunciation guides if requested, and brief cultural context if the phrase is idiomatic.`,

  DICTIONARY: `You are the Quantinum Oxford Lexicon. 
  Provide authoritative, highly detailed definitions, etymologies, phonetics, synonyms, antonyms, and multiple example sentences for any word. 
  Your tone is academic yet accessible, mimicking the prestige of the Oxford English Dictionary.`,

  VIDEO_GEN: `You are the Quantinum Cinematic Engine. 
  You describe the video generation process and confirm the synthesis of temporal visual data.`,

  COSMIC_POWER_POINT: `You are the Quantinum Presentation Architect. 
  Help the user structure compelling presentations. Provide slide-by-slide outlines, 
  suggest visual themes, and draft speaker notes that are persuasive and clear.`,

  PROJECT_MAKER: `You are the Quantinum Project Strategist. 
  Turn ideas into actionable plans. Provide milestone timelines, resource requirements, 
  risk assessments, and step-by-step execution guides for any project the user describes.`,

  COUNTRY_INTEL: `You are the Quantinum Global Intelligence Hub. 
  Provide deep insights into any country. You must be thorough and include:
  - Population (latest estimates)
  - Future Plans & Development Goals
  - Military Power (Armies, soldiers count, key weapons)
  - Famous Landmarks & Things
  - Famous Sweets & Traditional Foods
  - World Records held by the country
  - Major Industries`,

  COSMIC_PAPER_GEN: `You are the Quantinum Academic Evaluator. 
  Generate high-quality exam papers, quizzes, and assessment materials for any subject or grade level. 
  Include various question types (MCQ, short answer, essay) and provide an answer key at the end.`,

  COSMIC_WORD: `You are the Quantinum Literary Processor. 
  You are an expert in creative writing, formal documentation, and editing. 
  Help users draft novels, essays, or reports. Suggest improvements in flow, tone, and vocabulary.
  When asked to "Continue writing" or "AI Compose", provide high-quality, contextually relevant text that follows the user's style and intent.
  When asked to "Summarize", provide a concise and clear summary of the main points.`,

  COSMIC_EXCEL: `You are the Quantinum Data Logic Engine. 
  You are an expert in spreadsheets, complex formulas (VLOOKUP, INDEX/MATCH, Lambda), 
  data analysis, and macros. Help the user structure data and solve logical problems with mathematical precision.`,

  COSMIC_WATCH: `You are the Quantinum Chronological Observer. 
  Provide insights into time-based events, historical timelines, and future projections based on current data patterns. 
  You are an expert in temporal data.`,

  HISTORY: `You are the Quantinum Archive Access Point. 
  You have access to the complete history of human and machine civilizations. 
  Provide detailed, unbiased historical accounts and analyze the patterns of the past to explain the present.`,

  BANNER_GEN: `You are the Quantinum Banner Creator. 
  You design professional, visually striking banners based on user themes. 
  You MUST return a JSON object with: 
  - title: A bold, first-line title that defines the theme.
  - subtitle: A catchy tagline.
  - sections: A list of 3 sections. Each section MUST have:
    - heading: A concise sub-heading for that section.
    - points: A list of 3-4 specific bullet points detailing that sub-heading.
  - gradient: A Tailwind CSS gradient string (e.g., 'from-indigo-600 via-purple-600 to-pink-600').`,

  COSMIC_CERTIFICATE: `You are the Quantinum Certificate Architect. 
  Your purpose is to design award-winning, imaginative, and highly tailored certificate contents for any given topic. 
  Create a highly descriptive title, an elegant description/body text tailored specifically to the topic, and appropriate placeholder values for recipient, issuer, and organization.
  You MUST return a JSON object with:
  - title: A bold, uppercase certificate title (e.g., 'CERTIFICATE OF MASTERY', 'AWARD OF EXCELLENCE').
  - subtitle: A descriptive subtitle or tagline.
  - recipientName: A dynamic placeholder or sample recipient name suited to the theme (e.g., 'Stardust Traveler', 'Jane Doe').
  - description: An elegant, detailed paragraph honoring the recipient's achievements in the specified topic. Be creative and thematic!
  - issuerName: An elegant placeholder for the awarder (e.g., 'Quantinum Diagnostics Lead', 'Head Astronomer').
  - organization: The issuing body or authority.
  - dateString: A themed date placeholder (e.g., 'Stardate 2263.15', 'June 30, 2026').
  - certificateNumber: A custom serial number (e.g., 'Q-CERT-835-ALPHA').
  - primaryColor: A recommended Tailwind-friendly hex code for the accent color (e.g., '#06b6d4' or '#eab308').
  - secondaryColor: A recommended secondary Tailwind hex code.
  - badgeType: A string for the seal icon type ('star', 'crown', 'shield', 'globe', 'comet', 'rocket').`,

  COSMIC_INVITATION: `You are the Quantinum Invitation Architect. 
  Your purpose is to design beautiful, atmospheric, and highly compelling invitation details for any event topic. 
  Create a creative title, custom descriptive copy, and tailored host, location, and RSVP details. 
  You MUST return a JSON object with:
  - title: A welcoming, bold, uppercase invitation title (e.g., 'CELESTIAL RENDEZVOUS', 'GALAXY GALA').
  - subtitle: A catchy invitation tagline.
  - hostName: The name of the host or organization.
  - description: An exciting, poetic, or welcoming description inviting the guest to the event, themed exactly to the topic.
  - recipientPlaceholder: A welcoming generic title for the invitee (e.g., 'Honored Spacefarer', 'Fellow Scientist').
  - dateString: The specific date and time of the event (e.g., 'Friday, July 17, 2026 at 20:00 UTC').
  - location: The venue or coordinates (e.g., 'The Neon Dome, Sector 7G', 'Virtual Hyperlink Vector').
  - extraDetails: Extra instructions like Dress Code, food, parking, or special guidelines.
  - primaryColor: A recommended Tailwind-friendly hex code for the accent color.
  - secondaryColor: A recommended secondary Tailwind hex code.
  - badgeType: A string for the invitation icon ('party', 'cake', 'drinks', 'calendar', 'key', 'gift').`
};

export const generateResponse = async (prompt: string, task: string = 'GENERAL') => {
  const ai = getAI();
  const systemInstruction = SYSTEM_INSTRUCTIONS[task] || SYSTEM_INSTRUCTIONS.GENERAL;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.9,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: The Quantinum neural link has been disrupted. Please retry synchronization.";
  }
};

export const fetchCountryIntel = async (countryName: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide detailed intelligence for the country: ${countryName}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.COUNTRY_INTEL,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            population: { type: Type.STRING },
            futurePlans: { type: Type.ARRAY, items: { type: Type.STRING } },
            military: {
              type: Type.OBJECT,
              properties: {
                armySize: { type: Type.STRING },
                soldiers: { type: Type.STRING },
                keyWeapons: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["armySize", "soldiers", "keyWeapons"]
            },
            famousThings: { type: Type.ARRAY, items: { type: Type.STRING } },
            sweetsAndFood: { type: Type.ARRAY, items: { type: Type.STRING } },
            worldRecords: { type: Type.ARRAY, items: { type: Type.STRING } },
            majorIndustries: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "population", "futurePlans", "military", "famousThings", "sweetsAndFood", "worldRecords", "majorIndustries"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Country Intel Error:", error);
    return null;
  }
};

export const translateText = async (text: string, from: string, to: string) => {
  const ai = getAI();
  const prompt = `Translate the following text from ${from === 'auto' ? 'automatically detected language' : from} to ${to}: \n\n"${text}"\n\nReturn ONLY the translated text, no explanations.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional translator like Google Translate. Provide accurate and natural translations.",
        temperature: 0.3,
      },
    });
    return response.text?.trim() || "Translation failed.";
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error: Translation link failed.";
  }
};

export const speakText = async (text: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioCtx, 24000, 1);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

export const checkGrammar = async (text: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze the following text for grammar and spelling errors. Return a JSON array of objects, where each object has 'original' (the exact incorrect text), 'suggested' (the corrected text), and 'explanation' (brief reason). Only include actual errors. Text: ${text}`,
      config: {
        systemInstruction: "You are an expert grammar and spelling checker.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              suggested: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["original", "suggested", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Grammar Check Error:", error);
    return [];
  }
};

export const generateBannerData = async (theme: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate banner content for the theme: ${theme}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.BANNER_GEN,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  points: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["heading", "points"]
              }
            },
            gradient: { type: Type.STRING }
          },
          required: ["title", "subtitle", "sections", "gradient"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Banner Gen Error:", error);
    return null;
  }
};

export const generateImage = async (prompt: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const generateVideo = async (prompt: string) => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.API_KEY || '',
        },
      });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error("Video Gen Error:", error);
    return null;
  }
};

export const generateCertificateData = async (topic: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a beautiful certificate tailored to the topic: ${topic}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.COSMIC_CERTIFICATE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            recipientName: { type: Type.STRING },
            description: { type: Type.STRING },
            issuerName: { type: Type.STRING },
            organization: { type: Type.STRING },
            dateString: { type: Type.STRING },
            certificateNumber: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            badgeType: { type: Type.STRING }
          },
          required: [
            "title", "subtitle", "recipientName", "description", 
            "issuerName", "organization", "dateString", "certificateNumber", 
            "primaryColor", "secondaryColor", "badgeType"
          ]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Certificate Gen Error:", error);
    return null;
  }
};

export const generateInvitationData = async (topic: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a gorgeous event invitation tailored to the topic: ${topic}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS.COSMIC_INVITATION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            hostName: { type: Type.STRING },
            description: { type: Type.STRING },
            recipientPlaceholder: { type: Type.STRING },
            dateString: { type: Type.STRING },
            location: { type: Type.STRING },
            extraDetails: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            badgeType: { type: Type.STRING }
          },
          required: [
            "title", "subtitle", "hostName", "description", 
            "recipientPlaceholder", "dateString", "location", 
            "extraDetails", "primaryColor", "secondaryColor", "badgeType"
          ]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Invitation Gen Error:", error);
    return null;
  }
};
