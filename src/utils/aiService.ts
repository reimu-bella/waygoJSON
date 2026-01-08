import type { LorebookEntry } from '../types';

interface AIEditResponse {
  text?: string;
  content?: string;
  result?: string;
  generated_text?: string;
  response?: string;
  choices?: Array<{
    text?: string;
    message?: {
      content?: string;
    };
  }>;
}

// Get API key from environment variable
// Fallback to empty string if not set (will require explicit apiKey parameter)
const DEFAULT_API_KEY = import.meta.env.VITE_POLLINATIONS_API_KEY || '';

/**
 * Edits lorebook entry content using Pollinations AI Text API
 */
export async function editWithAI(
  entry: LorebookEntry,
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || DEFAULT_API_KEY;
  
  if (!key) {
    throw new Error(
      'Pollinations AI API key is not configured. ' +
      'Please set VITE_POLLINATIONS_API_KEY in your .env.local file. ' +
      'See .env.example for instructions.'
    );
  }
  
  // Construct the full prompt with context
  const fullPrompt = `${prompt}\n\nOriginal text:\n${entry.content}`;
  
  // Use the correct endpoint from gen.pollinations.ai (not enter.pollinations.ai)
  // Based on API schema: https://gen.pollinations.ai/v1/chat/completions
  const apiUrl = 'https://gen.pollinations.ai/v1/chat/completions';
  
  try {
    // OpenAI-compatible chat completions format
    const requestBody = {
      model: 'gemini-fast',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      max_tokens: 2000,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data: AIEditResponse = await response.json();
    
    // Handle OpenAI-compatible response format
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      if (choice.message?.content) {
        return choice.message.content;
      }
      if (choice.text) {
        return choice.text;
      }
    }
    
    // Handle other possible response formats (fallback)
    if (typeof data === 'string') {
      return data;
    }
    
    // Try different possible response field names
    const result =
      data.text ||
      data.content ||
      data.result ||
      data.generated_text ||
      data.response ||
      entry.content; // Fallback to original if no valid response
    
    if (result === entry.content) {
      throw new Error('API returned no valid response content');
    }
    
    return result;
  } catch (error) {
    console.error('AI editing error:', error);
    
    // If the API call fails, throw an error so the UI can handle it
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate AI edit. Please check the API endpoint and try again.');
  }
}

/**
 * Edits multiple entries with the same prompt
 */
export async function editMultipleEntriesWithAI(
  entries: LorebookEntry[],
  prompt: string,
  apiKey?: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Process entries sequentially to avoid rate limiting
  for (const entry of entries) {
    try {
      const editedContent = await editWithAI(entry, prompt, apiKey);
      results.set(String(entry.uid), editedContent);
    } catch (error) {
      // If one fails, use original content and continue
      results.set(String(entry.uid), entry.content);
    }
  }
  
  return results;
}