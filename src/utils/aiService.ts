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

// Prompt template - can be edited in src/prompts/aiEditPrompt.txt
// For now using inline template; can be loaded from file if needed
function getPromptTemplate(): string {
  // Try to load from public directory (if file is moved there)
  // For now, using inline template that matches the file content
  return `You are editing a lorebook entry in JSON format. The entry is part of a world_info/lorebook system and follows a specific structure.

The entry structure includes:
- uid: A unique identifier (number) - MUST be preserved exactly as provided
- key: An array of strings used for matching/triggering this entry
- keysecondary: An array of secondary keys
- comment: A short description/name for the entry
- content: The main text content of the entry
- Various boolean and numeric fields for configuration (constant, vectorized, selective, probability, depth, etc.)
- characterFilter: An object with isExclude, names, and tags arrays

Original entry JSON:
{ENTRY_JSON}

User instruction: {USER_INSTRUCTION}

IMPORTANT: 
- Respond with ONLY the edited entry JSON object
- Do NOT include any commentary, explanation, or markdown formatting
- Do NOT wrap the JSON in code blocks or quotes
- The response must be valid JSON that can be parsed directly
- Preserve the uid field exactly as it appears in the original entry
- Maintain all required fields from the original entry structure
- Only modify fields as instructed by the user`;
}

/**
 * Parses AI response to extract JSON, handling markdown code blocks and other formatting
 */
function extractJSONFromResponse(response: string): string {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  
  // Remove ```json or ``` markers
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  
  // Try to find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  return cleaned.trim();
}

/**
 * Validates that the parsed entry has required fields and preserves UID
 */
function validateEditedEntry(original: LorebookEntry, edited: any): LorebookEntry {
  // Ensure UID is preserved
  if (edited.uid !== original.uid) {
    edited.uid = original.uid;
  }
  
  // Ensure required fields exist, use original values as fallback
  const validated: LorebookEntry = {
    ...original,
    ...edited,
    uid: original.uid, // Always preserve original UID
  };
  
  return validated;
}

/**
 * Edits a full lorebook entry using Pollinations AI Text API
 * Returns the complete edited entry object
 */
export async function editWithAI(
  entry: LorebookEntry,
  userInstruction: string,
  apiKey?: string
): Promise<LorebookEntry> {
  const key = apiKey || DEFAULT_API_KEY;
  
  if (!key) {
    throw new Error(
      'Pollinations AI API key is not configured. ' +
      'Please set VITE_POLLINATIONS_API_KEY in your .env.local file. ' +
      'See .env.example for instructions.'
    );
  }
  
  // Get prompt template
  const template = getPromptTemplate();
  
  // Replace placeholders in template
  const entryJSON = JSON.stringify(entry, null, 2);
  const fullPrompt = template
    .replace('{ENTRY_JSON}', entryJSON)
    .replace('{USER_INSTRUCTION}', userInstruction);
  
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
      max_tokens: 4000, // Increased for full JSON responses
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
    
    // Extract response text
    let responseText = '';
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      responseText = choice.message?.content || choice.text || '';
    } else if (typeof data === 'string') {
      responseText = data;
    } else {
      responseText = data.text || data.content || data.result || data.generated_text || data.response || '';
    }
    
    if (!responseText) {
      throw new Error('API returned empty response');
    }
    
    // Extract and parse JSON from response
    const jsonString = extractJSONFromResponse(responseText);
    
    let editedEntry: any;
    try {
      editedEntry = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', jsonString);
      throw new Error(
        'AI returned invalid JSON. The response may have included commentary. ' +
        'Please try again or adjust your prompt.'
      );
    }
    
    // Validate and return edited entry
    return validateEditedEntry(entry, editedEntry);
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
  userInstruction: string,
  apiKey?: string
): Promise<Map<string, LorebookEntry>> {
  const results = new Map<string, LorebookEntry>();
  
  // Process entries sequentially to avoid rate limiting
  for (const entry of entries) {
    try {
      const editedEntry = await editWithAI(entry, userInstruction, apiKey);
      results.set(String(entry.uid), editedEntry);
    } catch (error) {
      // If one fails, use original entry and continue
      console.error(`Failed to edit entry ${entry.uid}:`, error);
      results.set(String(entry.uid), entry);
    }
  }
  
  return results;
}

/**
 * Transforms a narrative document using Pollinations AI
 * Combines beforePrompt, narrativeJson, and afterPrompt into a single request
 * Returns the transformed narrative JSON in the same structure
 */
export async function transformNarrative(
  narrativeJson: string,
  beforePrompt: string,
  afterPrompt: string,
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
  
  // Combine prompts: beforePrompt + narrativeJson + afterPrompt
  const fullPrompt = `${beforePrompt}\n\n${narrativeJson}\n\n${afterPrompt}`;
  
  // Use the same endpoint as editWithAI
  const apiUrl = 'https://gen.pollinations.ai/v1/chat/completions';
  
  try {
    const requestBody = {
      model: 'claude-fast',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      max_tokens: 8192, // Increased for full JSON responses
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
    
    // Extract response text
    let responseText = '';
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      responseText = choice.message?.content || choice.text || '';
    } else if (typeof data === 'string') {
      responseText = data;
    } else {
      responseText = data.text || data.content || data.result || data.generated_text || data.response || '';
    }
    
    if (!responseText) {
      throw new Error('API returned empty response');
    }
    
    // Extract and parse JSON from response
    const jsonString = extractJSONFromResponse(responseText);
    
    // Validate it's valid JSON
    try {
      const parsed = JSON.parse(jsonString);
      // Return formatted JSON
      return JSON.stringify(parsed, null, 2);
    } catch (parseError) {
      // Enhanced debug logging
      console.error('=== AI Response Debug Info ===');
      console.error('Raw response text:', responseText);
      console.error('Extracted JSON string:', jsonString);
      console.error('Parse error:', parseError);
      console.error('Full API response data:', JSON.stringify(data, null, 2));
      console.error('================================');
      
      // Create and download debug log file
      const debugLog = {
        timestamp: new Date().toISOString(),
        error: 'Failed to parse AI response as JSON',
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        request: {
          url: apiUrl,
          model: requestBody.model,
          max_tokens: requestBody.max_tokens,
          prompt_preview: fullPrompt.substring(0, 500) + (fullPrompt.length > 500 ? '...' : ''),
          full_prompt_length: fullPrompt.length,
        },
        response: {
          raw_response_text: responseText,
          extracted_json_string: jsonString,
          full_api_response: data,
        },
      };
      
      const debugBlob = new Blob([JSON.stringify(debugLog, null, 2)], { type: 'application/json' });
      const debugUrl = URL.createObjectURL(debugBlob);
      const debugLink = document.createElement('a');
      debugLink.href = debugUrl;
      debugLink.download = `ai-response-debug-${Date.now()}.json`;
      document.body.appendChild(debugLink);
      debugLink.click();
      document.body.removeChild(debugLink);
      URL.revokeObjectURL(debugUrl);
      
      throw new Error(
        'AI returned invalid JSON. A debug log file has been downloaded. ' +
        'Please check the downloaded file to see the full response. ' +
        'Also check the browser console for detailed error information.'
      );
    }
  } catch (error) {
    console.error('AI narrative transformation error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to transform narrative. Please check the API endpoint and try again.');
  }
}