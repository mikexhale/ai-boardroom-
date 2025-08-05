import { NextRequest, NextResponse } from 'next/server'
import experts from '@/data/experts.json'
import { callOpenRouter, createExpertSystemPrompt } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, expertId, sessionHistory, messageType, selectedExperts } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let response = ''
    let responseRole = 'assistant'
    let expertName = ''
    let expertAvatar = ''
    let expertTitle = ''
    let tokensUsed = 0

    // Build conversation history for context
    const conversationHistory = sessionHistory || []
    
    if (expertId) {
      // Individual expert response using OpenRouter
      const expert = experts.find(e => e.id === expertId)
      if (!expert) {
        return NextResponse.json(
          { error: 'Expert not found' },
          { status: 404 }
        )
      }

      expertName = expert.name
      expertAvatar = expert.avatar
      expertTitle = expert.title
      responseRole = 'expert'

      try {
        // Create conversation context
        const messages = [
          {
            role: 'system',
            content: createExpertSystemPrompt(expert)
          },
          ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ]

        const result = await callOpenRouter(messages, expertId)
        response = result.content
        tokensUsed = result.tokens
      } catch (error) {
        console.error('OpenRouter error for expert:', error)
        // Fallback to a simple expert response
        const expertiseArea = expert.expertise[0]?.toLowerCase() || 'their field'
        response = `Thank you for your question about "${message}". As an expert in ${expertiseArea}, I'll need to analyze this carefully. Due to a technical issue with our AI system, I'm unable to provide my full analysis right now. Please try again in a moment, and I'll share my detailed insights based on my expertise in ${expert.expertise.join(', ')}.`
      }
    } else if (messageType === 'moderator') {
      // Moderator response - use OpenRouter with moderator prompt
      responseRole = 'moderator'
      
      try {
        const moderatorPrompt = `You are an AI boardroom moderator facilitating strategic discussions between business experts. Your role is to:
- Acknowledge the user's question or challenge
- Direct appropriate experts to provide their insights
- Maintain professional, structured conversation flow
- Synthesize multiple expert perspectives when needed

Current question/challenge: "${message}"

${selectedExperts && selectedExperts.length > 0 ? 
  `Direct this to these specific experts: ${selectedExperts.map((id: string) => {
    const expert = experts.find(e => e.id === id)
    return expert ? `${expert.name} (${expert.title})` : 'Expert'
  }).join(', ')}` : 
  'Direct this to the most relevant board members based on the topic.'
}

Provide a professional moderator response that facilitates the discussion.`

        const messages = [
          {
            role: 'system',
            content: moderatorPrompt
          },
          {
            role: 'user', 
            content: message
          }
        ]

        const result = await callOpenRouter(messages)
        response = result.content
        tokensUsed = result.tokens
      } catch (error) {
        console.error('OpenRouter error for moderator:', error)
        response = `Thank you for presenting this challenge: "${message}". Let me direct this to our expert board members for their specialized analysis. Due to a technical issue, I'm providing a standard response, but our experts will still provide valuable insights.`
      }
    } else if (messageType === 'board-synthesis') {
      // Board synthesis using OpenRouter
      responseRole = 'moderator'
      
      try {
        const synthesisPrompt = `You are an AI boardroom moderator providing a final synthesis of expert discussions. 

Original challenge: "${message}"

Create a comprehensive board synthesis summary that includes:
- Key insights from multiple expert perspectives
- Consensus recommendations
- Next steps
- Strategic considerations

${selectedExperts && selectedExperts.length > 0 ? 
  `This synthesis represents insights from: ${selectedExperts.map((id: string) => {
    const expert = experts.find(e => e.id === id)
    return expert ? expert.name : 'Board Member'
  }).join(', ')}` : ''
}

Provide a professional, structured synthesis response.`

        const messages = [
          ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'system',
            content: synthesisPrompt
          },
          {
            role: 'user',
            content: `Please provide the board synthesis for: "${message}"`
          }
        ]

        const result = await callOpenRouter(messages)
        response = result.content
        tokensUsed = result.tokens
      } catch (error) {
        console.error('OpenRouter error for synthesis:', error)
        response = `**BOARD SYNTHESIS SUMMARY**\n\nThe board has analyzed your challenge regarding "${message}" and identified key strategic areas for consideration. Due to a technical issue with our AI system, I'm providing a standard synthesis, but the core recommendations remain valid: conduct thorough analysis, develop clear implementation plans, and maintain strategic focus.`
      }
    } else {
      // General board response using OpenRouter
      responseRole = 'board'
      
      try {
        const boardPrompt = `You are representing a collective AI expert board responding to strategic business questions. Provide insights that reflect the wisdom of multiple business experts across various domains like strategy, technology, finance, marketing, and operations.

Question: "${message}"

Provide a comprehensive board-level response that synthesizes multiple expert perspectives.`

        const messages = [
          ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'system',
            content: boardPrompt
          },
          {
            role: 'user',
            content: message
          }
        ]

        const result = await callOpenRouter(messages)
        response = result.content
        tokensUsed = result.tokens
      } catch (error) {
        console.error('OpenRouter error for board:', error)
        response = `The board has analyzed your question: "${message}". Due to a technical issue with our AI system, I'm providing a standard response. We recommend a comprehensive approach that balances immediate needs with long-term sustainability, but please try again to get our full expert analysis.`
      }
    }
    
    return NextResponse.json({
      response,
      role: responseRole,
      expertName,
      expertAvatar,
      expertTitle,
      timestamp: new Date().toISOString(),
      tokens: tokensUsed
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
} 