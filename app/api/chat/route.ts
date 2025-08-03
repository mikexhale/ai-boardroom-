import { NextRequest, NextResponse } from 'next/server'
import experts from '@/data/experts.json'

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

    let demoResponse = ''
    let responseRole = 'assistant'
    let expertName = ''
    let expertAvatar = ''
    let expertTitle = ''

    if (expertId) {
      // Individual expert response
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

      // Generate expert-specific response based on their expertise and personality
      const expertiseArea = expert.expertise[0]?.toLowerCase() || 'their field'
      const personalityStyle = expert.personality.style.toLowerCase()
      
      demoResponse = `${expert.name} (${expert.title}): Thank you for the question about "${message}". As a ${personalityStyle} professional with expertise in ${expertiseArea}, I see several key considerations. From my perspective, we should focus on strategic positioning and market opportunity. My ${expertiseArea} background suggests we need to consider both immediate tactical needs and long-term strategic implications. I recommend a balanced approach that leverages our core strengths while addressing the specific challenges you've outlined.`
      
      responseRole = 'expert'
    } else if (messageType === 'moderator') {
      // Moderator response - directs conversation to experts
      responseRole = 'moderator'
      
      if (selectedExperts && selectedExperts.length > 0) {
        // Moderator directing prompts to specific experts
        const expertPrompts = selectedExperts.map((expertId: string) => {
          const expert = experts.find(e => e.id === expertId)
          if (!expert) return ''
          
          const expertiseArea = expert.expertise[0]?.toLowerCase() || 'their field'
          return `- ${expert.name} (${expert.title}): Please analyze this from your ${expertiseArea} perspective. What strategic insights can you provide?`
        }).filter(Boolean)

        demoResponse = `Thank you for presenting this challenge: "${message}". Let me direct this to our expert board members for their specialized analysis.\n\n${expertPrompts.join('\n')}\n\nPlease provide your expert insights based on your respective areas of expertise.`
      } else {
        demoResponse = `Thank you for your question: "${message}". Let me facilitate a discussion among our board members to address this important point. The board acknowledges your inquiry and will provide comprehensive insights based on our collective expertise.`
      }
    } else if (messageType === 'board-synthesis') {
      // Moderator providing final synthesis
      responseRole = 'moderator'
      
      if (selectedExperts && selectedExperts.length > 0) {
        const expertNames = selectedExperts.map((expertId: string) => {
          const expert = experts.find(e => e.id === expertId)
          return expert?.name || 'Board Member'
        }).join(', ')

        demoResponse = `**BOARD SYNTHESIS SUMMARY**\n\nBased on our comprehensive discussion of "${message}", here's our collective analysis:\n\n**Key Insights from Our Expert Team:**\n- Strategic Perspective: Focus on market positioning and competitive advantage\n- Innovation Angle: Identify disruptive opportunities and technological leverage\n- Financial Considerations: Balance risk and return for sustainable growth\n- Operational Excellence: Streamline processes for maximum efficiency\n\n**Consensus Recommendations:**\n1. Conduct thorough market analysis\n2. Develop clear implementation roadmap\n3. Establish measurable success metrics\n4. Monitor progress and adjust strategy as needed\n\n**Next Steps:**\nOur expert team recommends immediate action on the highest-impact areas while maintaining flexibility for emerging opportunities.\n\nThis synthesis represents the collective wisdom of: ${expertNames}`
      } else {
        demoResponse = `**BOARD SYNTHESIS**\n\nThe board has analyzed your challenge and identified key strategic areas for consideration. We recommend a comprehensive approach that balances immediate needs with long-term sustainability.`
      }
    } else {
      // Board group response
      responseRole = 'board'
      demoResponse = `The board has analyzed your question: "${message}". As a collective, we've identified key strategic areas for consideration. We recommend a comprehensive approach that balances immediate needs with long-term sustainability. Each of our expert board members brings unique insights to this discussion.`
    }
    
    return NextResponse.json({
      response: demoResponse,
      role: responseRole,
      expertName,
      expertAvatar,
      expertTitle,
      timestamp: new Date().toISOString(),
      tokens: 0
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
} 