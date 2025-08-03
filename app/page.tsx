'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { 
  Users, MessageSquare, FileText, CheckCircle, Clock, Zap,
  ChevronRight, Building2, Palette, Heart, Megaphone, Brain,
  Crown, Plus, Search, Filter, Settings, Bell, Bookmark,
  ArrowRight, Play, Pause, RotateCcw, Download,
  Share2, MoreHorizontal, Calendar, Target, TrendingUp,
  Sparkles, Star, Award, Rocket, Globe, Shield, Eye,
  Lightbulb, BarChart3, PieChart, TrendingDown, Activity,
  Coffee, Briefcase, GraduationCap, Microscope, TestTube,
  Scale, Gavel, Hammer, Wrench, Cog, Database, Cloud,
  Wifi, Lock, Unlock, Key, UserCheck, UserX, Users2,
  UserPlus, UserMinus, UserCog, DollarSign,
  Stethoscope, Utensils, Dumbbell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import experts from '@/data/experts.json'
import { Expert, Conversation, Session } from '@/types'

export default function BoardroomPage() {
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'dashboard' | 'experts' | 'conversations' | 'session' | 'analytics'>('experts')
  const [hoveredExpert, setHoveredExpert] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isClient, setIsClient] = useState(false)
  const [sessionPrompt, setSessionPrompt] = useState('')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedExpertForQuestion, setSelectedExpertForQuestion] = useState<string | null>(null)
  const [sessionPhase, setSessionPhase] = useState<'initial' | 'discussion' | 'interactive'>('initial')
  const [meetingTimer, setMeetingTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [meetingAgenda, setMeetingAgenda] = useState<string[]>([])
  const [currentAgendaItem, setCurrentAgendaItem] = useState(0)
  const [activeVote, setActiveVote] = useState<{
    id: string
    question: string
    options: string[]
    votes: Record<string, number>
    isOpen: boolean
  } | null>(null)
  const [decisions, setDecisions] = useState<Array<{
    id: string
    question: string
    decision: string
    timestamp: Date
    expertConsensus: string
  }>>([])
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15])
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15])

  useEffect(() => {
    setIsClient(true)
    // Load sample conversations
    setConversations([
      {
        id: '1',
        title: 'Product Launch Strategy',
        description: 'Strategic planning for new product launch with marketing and finance experts',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        experts: ['marcus-johnson', 'alex-kim', 'elena-rodriguez'],
        messages: [],
        status: 'completed',
        tags: ['product', 'marketing', 'finance']
      },
      {
        id: '2',
        title: 'Healthcare Innovation Discussion',
        description: 'Exploring new healthcare technologies and patient care strategies',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        experts: ['dr-emma-watson', 'david-patel', 'lisa-park'],
        messages: [],
        status: 'active',
        tags: ['healthcare', 'technology', 'research']
      }
    ])
  }, [])

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(event.clientX - centerX)
    mouseY.set(event.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleExpertToggle = (expertId: string) => {
    setSelectedExperts(prev => 
      prev.includes(expertId) 
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    )
  }

  const startSession = async () => {
    if (selectedExperts.length === 0) return
    setShowSessionModal(true)
  }

  const handleSessionSubmit = async () => {
    if (!sessionPrompt.trim()) return
    
    setIsLoading(true)
    setShowSessionModal(false)
    setView('session')
    
    // Create a new session
    const newSession: Session = {
      id: Date.now().toString(),
      conversationId: Date.now().toString(),
      title: sessionPrompt.substring(0, 50) + '...',
      description: sessionPrompt,
      experts: selectedExperts,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      insights: [],
      actions: []
    }
    
    setActiveSession(newSession)
    
    // Initialize chat with Chairman's initial prompt
    const initialMessages = [
      {
        id: 'chairman-initial',
        sender: 'ceo',
        content: sessionPrompt,
        timestamp: new Date(),
        type: 'prompt'
      }
    ]
    setChatMessages(initialMessages)
    
    // Start the moderated discussion using the new API
    setTimeout(async () => {
      setIsLoading(false)
      setSessionPhase('discussion')
      
      try {
        // Step 1: Get moderator acknowledgment
        const moderatorResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: sessionPrompt,
            sessionHistory: initialMessages,
            messageType: 'moderator',
            selectedExperts: selectedExperts
          })
        })

        if (moderatorResponse.ok) {
          const moderatorData = await moderatorResponse.json()
          const moderatorMessage = {
            id: 'moderator-ack',
            sender: 'moderator',
            content: moderatorData.response,
            timestamp: new Date(),
            type: 'moderator-facilitation'
          }
          
          const messagesWithModerator = [...initialMessages, moderatorMessage]
          setChatMessages(messagesWithModerator)
          
          // Step 2: Get individual expert responses
          setTimeout(async () => {
            const expertMessages = []
            
            for (const expertId of selectedExperts) {
              const expertResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Please provide your expert analysis on: ${sessionPrompt}`,
                  expertId: expertId,
                  sessionHistory: messagesWithModerator,
                  messageType: 'expert',
                  selectedExperts: selectedExperts
                })
              })
              
              if (expertResponse.ok) {
                const expertData = await expertResponse.json()
                const expertMessage = {
                  id: `expert-response-${Date.now()}-${expertId}`,
                  sender: 'expert',
                  expertId: expertId,
                  expertName: expertData.expertName || 'Board Member',
                  expertAvatar: expertData.expertAvatar || '👤',
                  content: expertData.response,
                  timestamp: new Date(),
                  type: 'expert-response'
                }
                expertMessages.push(expertMessage)
              }
            }
            
            const messagesWithExperts = [...messagesWithModerator, ...expertMessages]
            setChatMessages(messagesWithExperts)
            
            // Step 3: Get final synthesis
            setTimeout(async () => {
              const synthesisResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: `Please provide a synthesis of all expert insights on: ${sessionPrompt}`,
                  sessionHistory: messagesWithExperts,
                  messageType: 'board-synthesis',
                  selectedExperts: selectedExperts
                })
              })
              
              if (synthesisResponse.ok) {
                const synthesisData = await synthesisResponse.json()
                const synthesisMessage = {
                  id: `synthesis-${Date.now()}`,
                  sender: 'moderator',
                  content: synthesisData.response,
                  timestamp: new Date(),
                  type: 'synthesis'
                }
                setChatMessages(prev => [...prev, synthesisMessage])
              }
            }, 2000)
          }, 1500)
        }
      } catch (error) {
        console.error('Error starting session:', error)
        // Fallback to old messages if API fails
        const moderatorAcknowledgment = {
          id: 'moderator-ack',
          sender: 'moderator',
          content: `Thank you, Mr. Chairman. I understand the challenge you've presented. Let me facilitate a structured discussion among our expert board members to address this strategic matter.`,
          timestamp: new Date(),
          type: 'moderator-facilitation'
        }
        
        const boardDiscussion = {
          id: 'board-discussion',
          sender: 'board',
          content: `As a board, we've analyzed your challenge. Here are our collective insights: We need to consider strategic positioning, operational efficiency, and market opportunity. Each of us brings unique expertise to this discussion.`,
          timestamp: new Date(Date.now() + 1000),
          type: 'board-analysis'
        }
        
        const moderatorSummary = {
          id: 'moderator-summary',
          sender: 'moderator',
          content: `Excellent discussion. We've identified key strategic areas: positioning, operations, and market opportunity. Mr. Chairman, what specific aspects would you like us to explore further, or do you have follow-up questions for the board?`,
          timestamp: new Date(Date.now() + 2000),
          type: 'summary'
        }
        
        setChatMessages([...initialMessages, moderatorAcknowledgment, boardDiscussion, moderatorSummary])
      }
      
      setSessionPhase('interactive')
    }, 3000)
  }

  const sendMessage = async (message: string, targetExpert?: string) => {
    if (!message.trim()) return
    
    const newMessage = {
      id: Date.now().toString(),
      sender: 'ceo',
      content: message,
      timestamp: new Date(),
      type: 'question',
      targetExpert: targetExpert
    }
    
    setChatMessages(prev => [...prev, newMessage])
    setCurrentMessage('')
    setIsTyping(true)
    
    try {
      // Call chat API with selected experts
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          expertId: targetExpert,
          sessionHistory: chatMessages,
          messageType: targetExpert ? 'expert' : 'moderator',
          selectedExperts: selectedExperts
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      let responseMessage
      if (targetExpert) {
        // Individual expert response
        responseMessage = {
          id: `response-${Date.now()}`,
          sender: 'expert',
          expertId: targetExpert,
          expertName: data.expertName || 'Board Member',
          expertAvatar: data.expertAvatar || '👤',
          content: data.response,
          timestamp: new Date(),
          type: 'expert-response'
        }
      } else {
        // Moderator response (facilitates board discussion)
        responseMessage = {
          id: `response-${Date.now()}`,
          sender: 'moderator',
          content: data.response,
          timestamp: new Date(),
          type: 'moderator-response'
        }
      }
      
      setChatMessages(prev => [...prev, responseMessage])
      
      // If this is the first message and no specific expert is targeted, 
      // automatically trigger expert responses after moderator
      if (!targetExpert && chatMessages.length === 0) {
        // Add a small delay before expert responses
        setTimeout(async () => {
          for (const expertId of selectedExperts) {
            const expertResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Please provide your expert analysis on: ${message}`,
                expertId: expertId,
                sessionHistory: chatMessages,
                messageType: 'expert',
                selectedExperts: selectedExperts
              })
            })
            
            if (expertResponse.ok) {
              const expertData = await expertResponse.json()
              const expertMessage = {
                id: `expert-response-${Date.now()}-${expertId}`,
                sender: 'expert',
                expertId: expertId,
                expertName: expertData.expertName || 'Board Member',
                expertAvatar: expertData.expertAvatar || '👤',
                content: expertData.response,
                timestamp: new Date(),
                type: 'expert-response'
              }
              setChatMessages(prev => [...prev, expertMessage])
            }
          }
          
          // Add final synthesis after all experts respond
          setTimeout(async () => {
            const synthesisResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Please provide a synthesis of all expert insights on: ${message}`,
                sessionHistory: chatMessages,
                messageType: 'board-synthesis',
                selectedExperts: selectedExperts
              })
            })
            
            if (synthesisResponse.ok) {
              const synthesisData = await synthesisResponse.json()
              const synthesisMessage = {
                id: `synthesis-${Date.now()}`,
                sender: 'moderator',
                content: synthesisData.response,
                timestamp: new Date(),
                type: 'synthesis'
              }
              setChatMessages(prev => [...prev, synthesisMessage])
            }
          }, 2000)
        }, 1500)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Fallback response
      if (targetExpert) {
        const respondingExpert = experts.find(e => e.id === targetExpert)
        const fallbackResponse = {
          id: `response-${Date.now()}`,
          sender: 'expert',
          expertId: targetExpert,
          expertName: respondingExpert?.name || 'Board Member',
          expertAvatar: respondingExpert?.avatar || '👤',
          content: `${respondingExpert?.name} responds: I understand your question. Let me provide some strategic insights based on my expertise in ${respondingExpert?.expertise[0]?.toLowerCase()}.`,
          timestamp: new Date(),
          type: 'expert-response'
        }
        setChatMessages(prev => [...prev, fallbackResponse])
      } else {
        const fallbackResponse = {
          id: `response-${Date.now()}`,
          sender: 'moderator',
          content: `The board acknowledges your question. Let me facilitate a discussion to address this important point.`,
          timestamp: new Date(),
          type: 'moderator-response'
        }
        setChatMessages(prev => [...prev, fallbackResponse])
      }
    } finally {
      setIsTyping(false)
    }
  }

  const askExpert = (expertId: string) => {
    setSelectedExpertForQuestion(expertId)
    setCurrentMessage(`@${experts.find(e => e.id === expertId)?.name} `)
  }

  const askAllExperts = () => {
    setSelectedExpertForQuestion(null)
    setCurrentMessage('@Board ')
  }

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMeetingTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const startTimer = () => {
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setMeetingTimer(0)
    setIsTimerRunning(false)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addAgendaItem = (item: string) => {
    setMeetingAgenda(prev => [...prev, item])
  }

  const nextAgendaItem = () => {
    if (currentAgendaItem < meetingAgenda.length - 1) {
      setCurrentAgendaItem(prev => prev + 1)
    }
  }

  const previousAgendaItem = () => {
    if (currentAgendaItem > 0) {
      setCurrentAgendaItem(prev => prev - 1)
    }
  }

  // Voting system
  const startVote = (question: string, options: string[]) => {
    setActiveVote({
      id: Date.now().toString(),
      question,
      options,
      votes: {},
      isOpen: true
    })
  }

  const castVote = (option: string) => {
    if (activeVote) {
      setActiveVote(prev => prev ? {
        ...prev,
        votes: { ...prev.votes, [option]: (Number(prev.votes[option]) || 0) + 1 }
      } : null)
    }
  }

  const closeVote = () => {
    if (activeVote) {
      const winningOption = Object.entries(activeVote.votes).reduce((a, b) => 
        (activeVote.votes[a[0]] || 0) > (activeVote.votes[b[0]] || 0) ? a : b
      )[0]
      
      const decision = {
        id: activeVote.id,
        question: activeVote.question,
        decision: winningOption,
        timestamp: new Date(),
        expertConsensus: `Board consensus: ${winningOption}`
      }
      
      setDecisions(prev => [...prev, decision])
      setActiveVote(null)
      
      // Add decision to chat
      const decisionMessage = {
        id: `decision-${Date.now()}`,
        sender: 'moderator',
        content: `Board decision: ${activeVote.question} → ${winningOption}`,
        timestamp: new Date(),
        type: 'decision'
      }
      setChatMessages(prev => [...prev, decisionMessage])
    }
  }

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.expertise.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || expert.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', name: 'All Experts', icon: Users, count: experts.length, color: 'from-gray-500 to-slate-500' },
    { id: 'strategy', name: 'Strategy', icon: Target, count: experts.filter(e => e.category === 'strategy').length, color: 'from-blue-500 to-cyan-500' },
    { id: 'technology', name: 'Technology', icon: Brain, count: experts.filter(e => e.category === 'technology').length, color: 'from-indigo-500 to-purple-500' },
    { id: 'finance', name: 'Finance', icon: TrendingUp, count: experts.filter(e => e.category === 'finance').length, color: 'from-green-500 to-emerald-500' },
    { id: 'marketing', name: 'Marketing', icon: Megaphone, count: experts.filter(e => e.category === 'marketing').length, color: 'from-orange-500 to-red-500' },
    { id: 'legal', name: 'Legal', icon: Scale, count: experts.filter(e => e.category === 'legal').length, color: 'from-yellow-500 to-orange-500' },
    { id: 'operations', name: 'Operations', icon: Cog, count: experts.filter(e => e.category === 'operations').length, color: 'from-gray-500 to-slate-500' },
    { id: 'healthcare', name: 'Healthcare', icon: Stethoscope, count: experts.filter(e => e.category === 'healthcare').length, color: 'from-red-500 to-pink-500' },
    { id: 'cooking', name: 'Cooking', icon: Utensils, count: experts.filter(e => e.category === 'cooking').length, color: 'from-orange-500 to-red-500' },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell, count: experts.filter(e => e.category === 'fitness').length, color: 'from-green-500 to-emerald-500' },
    { id: 'creative', name: 'Creative', icon: Palette, count: experts.filter(e => e.category === 'creative').length, color: 'from-purple-500 to-pink-500' },
    { id: 'security', name: 'Security', icon: Shield, count: experts.filter(e => e.category === 'security').length, color: 'from-gray-500 to-slate-500' },
    { id: 'product', name: 'Product', icon: Zap, count: experts.filter(e => e.category === 'product').length, color: 'from-purple-500 to-blue-500' },
    { id: 'research', name: 'Research', icon: Microscope, count: experts.filter(e => e.category === 'research').length, color: 'from-teal-500 to-cyan-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        {isClient && (
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20"
                animate={{
                  x: [0, 1000],
                  y: [0, 800],
                  scale: [0, 1, 0],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    <Crown className="w-8 h-8 text-purple-400" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    AI Boardroom
                  </h1>
                </motion.div>
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.button 
                  className="p-2 text-gray-400 hover:text-white transition-colors relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bell className="w-5 h-5" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.button>
                <motion.button 
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <nav className="flex space-x-8 mb-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'experts', label: 'Your Board', icon: Users },
              { id: 'conversations', label: 'Conversations', icon: MessageSquare },
              { id: 'session', label: 'Active Session', icon: Play },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                  view === item.id 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Dashboard View */}
          {view === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center mb-12">
                <motion.h1 
                  className="text-5xl md:text-7xl font-bold text-white mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Your Personal
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                    AI Advisory Board
                  </span>
                </motion.h1>
                <motion.p 
                  className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Access world-class expertise anytime. Get strategic insights, solve complex problems, 
                  and make better decisions with your personal AI board of expert advisors.
                </motion.p>
              </div>

              {/* Stats Grid */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {[
                  { icon: Users, label: 'Expert Advisors', value: '15', color: 'from-blue-500 to-cyan-500' },
                  { icon: MessageSquare, label: 'Conversations', value: '47', color: 'from-purple-500 to-pink-500' },
                  { icon: TrendingUp, label: 'Insights Generated', value: '1,234', color: 'from-green-500 to-emerald-500' },
                  { icon: Clock, label: 'Hours Saved', value: '89', color: 'from-orange-500 to-red-500' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="glass rounded-xl p-6 text-center"
                    whileHover={{ scale: 1.05, y: -5 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <motion.button
                  onClick={() => setView('experts')}
                  className="glass rounded-xl p-8 text-left hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Start New Session</h3>
                      <p className="text-gray-400">Select your expert advisors</p>
                    </div>
                  </div>
                  <p className="text-gray-300">Choose from our world-class AI experts and start a strategic session.</p>
                </motion.button>

                <motion.button
                  onClick={() => setView('conversations')}
                  className="glass rounded-xl p-8 text-left hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">View Conversations</h3>
                      <p className="text-gray-400">Continue previous sessions</p>
                    </div>
                  </div>
                  <p className="text-gray-300">Access your saved conversations and strategic insights.</p>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* Experts View */}
          {view === 'experts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Your Expert Advisory Board</h2>
                  <p className="text-gray-400">Select your board members to start a strategic session</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search experts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-gray-800">
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setFilterCategory(category.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-full text-sm transition-all duration-300",
                      filterCategory === category.id
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <category.icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {category.count}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Experts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredExperts.map((expert, index) => (
                  <motion.div
                    key={expert.id}
                    className={cn(
                      "glass rounded-lg p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                      selectedExperts.includes(expert.id) && "ring-2 ring-purple-500 bg-purple-500/20"
                    )}
                    onClick={() => handleExpertToggle(expert.id)}
                    onMouseEnter={() => setHoveredExpert(expert.id)}
                    onMouseLeave={() => {
                      setHoveredExpert(null)
                      handleMouseLeave()
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Compact Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <motion.div 
                        className="text-2xl"
                        animate={hoveredExpert === expert.id ? { rotate: [0, 5, -5, 0] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {expert.avatar}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{expert.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{expert.title}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <motion.div 
                          className={cn(
                            "w-2 h-2 rounded-full",
                            expert.isAvailable ? "bg-green-400" : "bg-gray-500"
                          )}
                          animate={expert.isAvailable ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        {selectedExperts.includes(expert.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    {/* Brief Description */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-300 line-clamp-2">{expert.personality.style}</p>
                    </div>

                    {/* Top 2 Expertise Tags */}
                    <div className="flex flex-wrap gap-1">
                      {expert.expertise.slice(0, 2).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {expert.expertise.length > 2 && (
                        <span className="px-2 py-1 bg-purple-500/20 rounded-full text-xs text-purple-300">
                          +{expert.expertise.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Hover Actions */}
                    {hoveredExpert === expert.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center space-x-2">
                          <motion.button
                            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add view details functionality
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add quick chat functionality
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            className="p-2 bg-purple-500 rounded-full text-white hover:bg-purple-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExpertToggle(expert.id)
                            }}
                          >
                            {selectedExperts.includes(expert.id) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Start Session Button */}
              {selectedExperts.length > 0 && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    onClick={startSession}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Preparing Session...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Board Session</span>
                      </>
                    )}
                  </motion.button>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedExperts.length} expert{selectedExperts.length !== 1 ? 's' : ''} selected
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Conversations View */}
          {view === 'conversations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Your Conversations</h2>
                <motion.button 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>New Conversation</span>
                </motion.button>
              </div>

              {conversations.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
                  <p className="text-gray-400">Start your first board session to begin building your conversation history.</p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {conversations.map((conversation) => (
                    <motion.div 
                      key={conversation.id} 
                      className="glass rounded-xl p-6"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{conversation.title}</h3>
                          <p className="text-gray-400">{conversation.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {conversation.experts.length} experts
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            conversation.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          )}>
                            {conversation.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Interactive Boardroom Session */}
          {view === 'session' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[calc(100vh-200px)] flex flex-col"
            >
              {/* Session Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Boardroom Meeting</h2>
                    <p className="text-gray-400">
                      {sessionPhase === 'initial' && 'Initializing session...'}
                      {sessionPhase === 'discussion' && 'Moderated discussion in progress'}
                      {sessionPhase === 'interactive' && 'Interactive Q&A with board'}
                    </p>
                  </div>
                </div>
                
                {/* Meeting Controls */}
                <div className="flex items-center space-x-4">
                  {/* Session Status */}
                  {activeSession && (
                    <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-white">
                        {sessionPhase === 'interactive' ? 'Active' : 'In Progress'}
                      </span>
                    </div>
                  )}
                  
                  {/* Timer */}
                  <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono text-white">{formatTime(meetingTimer)}</span>
                    <div className="flex space-x-1">
                      <motion.button
                        onClick={isTimerRunning ? pauseTimer : startTimer}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </motion.button>
                      <motion.button
                        onClick={resetTimer}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Agenda */}
                  {meetingAgenda.length > 0 && (
                    <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">
                        {currentAgendaItem + 1} / {meetingAgenda.length}
                      </span>
                      <div className="flex space-x-1">
                        <motion.button
                          onClick={previousAgendaItem}
                          disabled={currentAgendaItem === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </motion.button>
                        <motion.button
                          onClick={nextAgendaItem}
                          disabled={currentAgendaItem === meetingAgenda.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                  
                  <motion.button
                    className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              {activeSession ? (
                <div className="flex-1 flex flex-col glass rounded-xl overflow-hidden">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">
                        <motion.div
                          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <h3 className="text-xl font-semibold text-white mb-2">Session Starting</h3>
                        <p className="text-gray-400">Your expert board is preparing for the meeting...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            className={cn(
                              "flex space-x-3",
                              message.sender === 'ceo' ? "justify-end" : "justify-start"
                            )}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {message.sender !== 'ceo' && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm">
                                  {message.expertAvatar || '👤'}
                                </div>
                              </div>
                            )}
                            <div className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              message.sender === 'ceo' 
                                ? "bg-purple-600 text-white" 
                                : message.sender === 'moderator'
                                ? "bg-blue-600 text-white"
                                : message.sender === 'board'
                                ? "bg-green-600 text-white"
                                : "bg-white/10 text-gray-300"
                            )}>
                              {message.sender !== 'ceo' && (
                                <div className="text-xs font-medium mb-1 text-gray-400">
                                  {message.sender === 'board' ? 'Board Consensus' : message.expertName || 'Board Member'}
                                </div>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <div className="text-xs opacity-60 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {isTyping && (
                          <motion.div
                            className="flex space-x-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-sm">
                                🤖
                              </div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex space-x-1">
                                <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                                <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                                <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Expert Quick Actions */}
                  {sessionPhase === 'interactive' && (
                    <div className="border-t border-white/10 p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm text-gray-400">Quick Actions:</span>
                        <motion.button
                          onClick={askAllExperts}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs hover:bg-blue-500/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          Ask Board
                        </motion.button>
                        <motion.button
                          onClick={() => startVote('Should we proceed with this strategy?', ['Yes', 'No', 'Need more info'])}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs hover:bg-green-500/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          Start Vote
                        </motion.button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedExperts.map((expertId) => {
                          const expert = experts.find(e => e.id === expertId)
                          return (
                            <motion.button
                              key={expertId}
                              onClick={() => askExpert(expertId)}
                              className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 hover:bg-white/20 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              <span>{expert?.avatar}</span>
                              <span>Ask {expert?.name}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Vote */}
                  {activeVote && (
                    <div className="border-t border-white/10 p-4 bg-green-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Active Vote</h4>
                        <motion.button
                          onClick={closeVote}
                          className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          Close Vote
                        </motion.button>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{activeVote.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {activeVote.options.map((option) => (
                          <motion.button
                            key={option}
                            onClick={() => castVote(option)}
                            className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/30 transition-colors"
                            whileHover={{ scale: 1.05 }}
                          >
                            {option} ({activeVote.votes[option] || 0})
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Decisions Panel */}
                  {decisions.length > 0 && (
                    <div className="border-t border-white/10 p-4 bg-blue-500/10">
                      <h4 className="text-sm font-semibold text-white mb-3">Board Decisions</h4>
                      <div className="space-y-2 max-h-20 overflow-y-auto">
                        {decisions.slice(-3).map((decision) => (
                          <div key={decision.id} className="text-xs text-gray-300">
                            <span className="font-medium">{decision.question}</span>
                            <span className="text-green-400 ml-2">→ {decision.decision}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="border-t border-white/10 p-4">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage(currentMessage, selectedExpertForQuestion || undefined)
                          }
                        }}
                        placeholder={selectedExpertForQuestion 
                          ? `Ask ${experts.find(e => e.id === selectedExpertForQuestion)?.name}...`
                          : "Ask the board or moderator a question..."
                        }
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <motion.button
                        onClick={() => sendMessage(currentMessage, selectedExpertForQuestion || undefined)}
                        disabled={!currentMessage.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No active session</h3>
                  <p className="text-gray-400">Select experts and start a board session to begin.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Analytics View */}
          {view === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Session Duration', value: '24.5 min', icon: Clock, color: 'from-blue-500 to-cyan-500' },
                  { title: 'Expert Utilization', value: '87%', icon: Users, color: 'from-purple-500 to-pink-500' },
                  { title: 'Insight Quality', value: '9.2/10', icon: Star, color: 'from-yellow-500 to-orange-500' },
                  { title: 'Decision Impact', value: '+34%', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
                  { title: 'Cost Savings', value: '$12.4K', icon: DollarSign, color: 'from-red-500 to-pink-500' },
                  { title: 'User Satisfaction', value: '96%', icon: Heart, color: 'from-pink-500 to-rose-500' }
                ].map((metric, index) => (
                  <motion.div
                    key={metric.title}
                    className="glass rounded-xl p-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center mb-4`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{metric.title}</h3>
                    <div className="text-3xl font-bold text-white">{metric.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl max-w-2xl w-full p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Start Board Session</h2>
              <p className="text-gray-400 mb-6">
                Describe your challenge or question for the expert board. Be specific about your goals, constraints, and timeline.
              </p>
              
              <textarea
                value={sessionPrompt}
                onChange={(e) => setSessionPrompt(e.target.value)}
                placeholder="Describe your strategic challenge, business problem, or decision that needs expert analysis..."
                className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {selectedExperts.length} expert{selectedExperts.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    onClick={() => setShowSessionModal(false)}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSessionSubmit}
                    disabled={!sessionPrompt.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 