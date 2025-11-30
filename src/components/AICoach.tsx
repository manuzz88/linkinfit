import { hapticFeedback } from '../utils/haptics';
import React, { useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Ciao Manuel! 👋 Sono Alex, il tuo AI Personal Trainer. Come posso aiutarti oggi?',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    hapticFeedback('selection')
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const getAIResponse = (_input: string): string => {
    const responses = [
      'Ottima domanda! Per il tuo obiettivo di massa muscolare, ti consiglio di mantenere il range 8-12 ripetizioni con carichi progressivi. 💪',
      'Ricorda che il recupero è importante quanto l\'allenamento. Assicurati di dormire 7-8 ore per notte! 😴',
      'Per massimizzare i risultati, concentrati sulla forma corretta piuttosto che sul peso massimo. La qualità batte sempre la quantità! 🎯',
      'Hai fatto un ottimo lavoro questa settimana! La costanza è la chiave del successo nel fitness. Continua così! 🔥',
      'Ti suggerisco di aumentare gradualmente il peso quando riesci a completare tutte le serie nel range superiore di ripetizioni. 📈'
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="flex flex-col h-screen tg-bg">
      {/* Header */}
      <div className="sticky top-0 tg-bg border-b border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tg-text">Coach Alex</h1>
            <p className="text-sm tg-hint">Il tuo AI Personal Trainer</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'user'
                  ? 'tg-button text-white'
                  : 'tg-secondary-bg tg-text'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-white opacity-75' : 'tg-hint'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="tg-secondary-bg tg-text px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 tg-bg border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Scrivi un messaggio..."
            className="flex-1 input"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="btn btn-primary p-3 haptic-light disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {[
            'Come migliorare la forma?',
            'Consigli per la massa',
            'Gestione del riposo',
            'Progressione pesi'
          ].map((question) => (
            <button
              key={question}
              onClick={() => {
                setInputText(question)
                hapticFeedback('selection')
              }}
              className="btn btn-secondary text-xs px-3 py-1 haptic-light"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AICoach
