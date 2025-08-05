interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatMessage {
  role: string;
  content: string;
}

export async function callOpenRouter(
  messages: ChatMessage[],
  expertId?: string,
  maxTokens: number = 2000
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Default model - fast and cost-effective
  let model = 'anthropic/claude-3.5-haiku:beta';
  
  // Use more sophisticated models for specific experts if needed
  if (expertId === 'jessica-williams') {
    model = 'anthropic/claude-3.5-sonnet:beta'; // Better for creative/design work
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Boardroom'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter');
    }

    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('OpenRouter call failed:', error);
    throw error;
  }
}

export function createExpertSystemPrompt(expert: any): string {
  const expertise = expert.expertise.join(', ');
  const style = expert.personality.style;
  const approach = expert.personality.approach;
  
  return `You are ${expert.name}, ${expert.title}. You are a world-class expert with deep knowledge in: ${expertise}.

Your personality style is: ${style}
Your approach is: ${approach}

You are participating in an AI boardroom discussion where business leaders seek strategic advice. Provide insights that are:
- Specific to your area of expertise
- Actionable and practical
- Strategic and forward-thinking
- Reflective of your personality style

Keep responses focused, professional, and valuable. Aim for 2-3 paragraphs unless a longer response is specifically needed.

Always respond as ${expert.name} and maintain your expert perspective throughout the conversation.`;
}