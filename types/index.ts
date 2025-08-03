export interface Expert {
  id: string
  name: string
  title: string
  avatar: string
  expertise: string[]
  personality: {
    style: string
    traits: string[]
    communication: string
    background: string
  }
  systemPrompt: string
  color: string
  isAvailable: boolean
}

export interface Conversation {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  experts: string[]
  messages: Message[]
  status: 'active' | 'archived' | 'completed'
  tags: string[]
  summary?: string
}

export interface Message {
  id: string
  conversationId: string
  sender: 'user' | 'expert' | 'moderator'
  expertId?: string
  content: string
  timestamp: Date
  type: 'text' | 'insight' | 'recommendation' | 'question' | 'action'
  metadata?: {
    confidence?: number
    category?: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
    followUp?: boolean
  }
}

export interface Session {
  id: string
  conversationId: string
  title: string
  description: string
  experts: string[]
  status: 'preparing' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
  duration?: number
  insights: Insight[]
  actions: Action[]
}

export interface Insight {
  id: string
  sessionId: string
  expertId: string
  title: string
  content: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  createdAt: Date
  tags: string[]
}

export interface Action {
  id: string
  sessionId: string
  title: string
  description: string
  assignedTo?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: Date
  completedAt?: Date
}

export interface BoardRequest {
  prompt: string
  expertIds: string[]
  conversationId?: string
  sessionType?: 'quick' | 'deep' | 'strategic'
  context?: string
  flow?: 'moderated' | 'free-form'
}

export interface BoardResponse {
  sessionId: string
  conversationId: string
  messages: Message[]
  insights: Insight[]
  actions: Action[]
  summary: string
}

export interface User {
  id: string
  name: string
  email: string
  preferences: {
    defaultExperts: string[]
    sessionTypes: string[]
    notificationSettings: {
      email: boolean
      push: boolean
      insights: boolean
    }
  }
  conversations: string[]
  createdAt: Date
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  experts: string[]
  prompt: string
  tags: string[]
  isPublic: boolean
  usageCount: number
}

export interface Notification {
  id: string
  userId: string
  type: 'insight' | 'action' | 'reminder' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
  data?: any
} 