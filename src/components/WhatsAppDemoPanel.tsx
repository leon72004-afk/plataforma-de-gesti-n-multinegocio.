import { useEffect, useMemo, useRef, useState } from 'react';

type Conversation = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  unread: number;
  lastMessage: string;
  status: 'online' | 'offline';
};

type Message = {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
};

const initialConversations: Conversation[] = [
  {
    id: '1',
    name: 'Carlos Ramírez',
    phone: '+57 300 123 4567',
    vehicle: 'Yamaha MT-03',
    unread: 0,
    lastMessage: 'Perfecto, confirmo mi cita.',
    status: 'online',
  },
  {
    id: '2',
    name: 'Laura Gómez',
    phone: '+57 310 555 8899',
    vehicle: 'AKT NKD 125',
    unread: 2,
    lastMessage: '¿Tienen disponibilidad mañana?',
    status: 'offline',
  },
  {
    id: '3',
    name: 'Miguel Torres',
    phone: '+57 315 777 2020',
    vehicle: 'Pulsar NS 200',
    unread: 1,
    lastMessage: 'Quiero cambiar la hora de la cita.',
    status: 'online',
  },
];

const initialMessages: Message[] = [
  {
    id: 'm1',
    conversationId: '1',
    direction: 'outbound',
    text: 'Hola Carlos 👋 Te recordamos tu cita de lavado para hoy a las 3:00 p.m. en MotoSpa Premium.',
    time: '09:15',
    status: 'read',
  },
  {
    id: 'm2',
    conversationId: '1',
    direction: 'inbound',
    text: 'Perfecto, confirmo mi cita.',
    time: '09:17',
  },
  {
    id: 'm3',
    conversationId: '2',
    direction: 'inbound',
    text: 'Hola, ¿tienen disponibilidad mañana?',
    time: '10:02',
  },
  {
    id: 'm4',
    conversationId: '3',
    direction: 'inbound',
    text: 'Quiero cambiar la hora de la cita.',
    time: '10:20',
  },
];

function getTime() {
  return new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createId() {
  return Math.random().toString(36).slice(2);
}

export function WhatsAppDemoPanel() {
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [activeId, setActiveId] = useState('1');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId),
    [conversations, activeId]
  );

  const activeMessages = useMemo(
    () => messages.filter((item) => item.conversationId === activeId),
    [messages, activeId]
  );

  useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
}, [activeId, activeMessages.length, typing]);

  useEffect(() => {
    setConversations((prev) =>
      prev.map((item) =>
        item.id === activeId ? { ...item, unread: 0 } : item
      )
    );
  }, [activeId]);

  // Simula mensajes entrantes como si fueran cambios recibidos por webhook
  useEffect(() => {
    const demoReplies = [
      {
        conversationId: '2',
        text: 'Me interesa el lavado premium para mañana en la tarde.',
      },
      {
        conversationId: '3',
        text: '¿Podemos dejarla para las 4:30 p.m.?',
      },
      {
        conversationId: '1',
        text: 'Ya voy en camino, gracias.',
      },
    ];

    const interval = setInterval(() => {
      const random = demoReplies[Math.floor(Math.random() * demoReplies.length)];

      const newMessage: Message = {
        id: createId(),
        conversationId: random.conversationId,
        direction: 'inbound',
        text: random.text,
        time: getTime(),
      };

      setMessages((prev) => [...prev, newMessage]);

      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== random.conversationId) return conversation;

          return {
            ...conversation,
            lastMessage: random.text,
            unread:
              random.conversationId === activeId
                ? 0
                : conversation.unread + 1,
          };
        })
      );
    }, 12000);

    return () => clearInterval(interval);
  }, [activeId]);

  function updateConversationLastMessage(conversationId: string, text: string) {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: text,
              unread: 0,
            }
          : conversation
      )
    );
  }

  function sendText(textToSend?: string) {
    const text = textToSend || draft;

    if (!text.trim() || !activeConversation) return;

    const newMessage: Message = {
      id: createId(),
      conversationId: activeConversation.id,
      direction: 'outbound',
      text,
      time: getTime(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMessage]);
    updateConversationLastMessage(activeConversation.id, text);
    setDraft('');

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === newMessage.id
            ? { ...message, status: 'delivered' }
            : message
        )
      );
    }, 800);

    setTyping(true);

    setTimeout(() => {
      const autoReply: Message = {
        id: createId(),
        conversationId: activeConversation.id,
        direction: 'inbound',
        text: 'Gracias, quedo atento. 👍',
        time: getTime(),
      };

      setMessages((prev) => [...prev, autoReply]);
      updateConversationLastMessage(activeConversation.id, autoReply.text);
      setTyping(false);
    }, 1800);
  }

  function sendReminder() {
    if (!activeConversation) return;

    sendText(
      `Hola ${activeConversation.name.split(' ')[0]} 👋 Te recordamos tu cita de lavado para hoy. Responde CONFIRMAR para mantenerla o REAGENDAR para cambiarla.`
    );
  }

  function sendConfirmation() {
    if (!activeConversation) return;

    sendText(
      `Tu cita ha sido confirmada ✅ Te esperamos en MotoSpa Premium. Moto registrada: ${activeConversation.vehicle}.`
    );
  }

  function sendReschedule() {
    sendText(
      'Claro, podemos ayudarte a reagendar. Tenemos disponibilidad hoy a las 4:30 p.m. o mañana a las 10:00 a.m.'
    );
  }

  return (
  <div className="rounded-2xl border border-[#1E293B] bg-[#0B1120] shadow-sm overflow-hidden h-[calc(100vh-190px)] min-h-[620px] max-h-[760px] flex flex-col">
    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#1E293B] bg-gradient-to-r from-[#0f766e] to-[#115e59] text-white">
      <div>
        <div className="font-bold text-lg">Recordatorios WhatsApp</div>
        <div className="text-xs text-emerald-100/80">
          Demo visual · WhatsApp Business
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1 rounded-full border border-white/10">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        En vivo
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] flex-1 min-h-0 overflow-hidden">
      {/* Sidebar */}
      <aside className="border-r border-[#1E293B] bg-[#0F172A] h-full min-h-0 overflow-y-auto">
        <div className="p-3 border-b border-[#1E293B] bg-[#111827]">
          <input
            placeholder="Buscar cliente o teléfono..."
            className="w-full rounded-lg border border-[#334155] bg-[#0B1120] px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setActiveId(conversation.id)}
            className={`w-full text-left px-4 py-3 border-b border-[#1E293B] transition ${
              activeId === conversation.id
                ? 'bg-[#1E293B] border-l-4 border-emerald-500'
                : 'hover:bg-[#111827]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {conversation.name.charAt(0)}
                </div>

                <div>
                  <div className="font-semibold text-sm text-white">
                    {conversation.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {conversation.phone}
                  </div>
                  <div className="text-xs text-gray-500">
                    {conversation.vehicle}
                  </div>
                </div>
              </div>

              {conversation.unread > 0 && (
                <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">
                  {conversation.unread}
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-400 truncate">
              {conversation.lastMessage}
            </div>
          </button>
        ))}
      </aside>

      {/* Chat */}
      <main className="flex flex-col bg-[#111827] h-full min-h-0 overflow-hidden">
        <div className="shrink-0 px-4 py-3 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              {activeConversation?.name.charAt(0)}
            </div>

            <div>
              <div className="font-semibold text-sm text-white">
                {activeConversation?.name}
              </div>
              <div className="text-xs text-gray-400">
                {typing
                  ? 'escribiendo...'
                  : activeConversation?.status === 'online'
                    ? 'en línea'
                    : activeConversation?.phone}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            {activeConversation?.vehicle}
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 p-3 bg-[#0B1120] border-b border-[#1E293B] flex flex-wrap gap-2">
          <button
            onClick={sendReminder}
            className="rounded-full bg-emerald-600 text-white text-xs px-3 py-2 hover:bg-emerald-700 transition"
          >
            Enviar recordatorio
          </button>

          <button
            onClick={sendConfirmation}
            className="rounded-full bg-blue-600 text-white text-xs px-3 py-2 hover:bg-blue-700 transition"
          >
            Confirmar cita
          </button>

          <button
            onClick={sendReschedule}
            className="rounded-full bg-amber-500 text-white text-xs px-3 py-2 hover:bg-amber-600 transition"
          >
            Reagendar
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="whatsapp-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3 bg-[#111827]"
          style={{ scrollbarGutter: 'stable' }}>
          {activeMessages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm border ${
                message.direction === 'outbound'
                  ? 'ml-auto bg-emerald-900/40 border-emerald-700/40 text-emerald-50'
                  : 'mr-auto bg-[#1E293B] border-[#334155] text-gray-100'
              }`}
            >
              <div>{message.text}</div>

              <div className="mt-1 flex justify-end gap-1 text-[10px] text-gray-400">
                <span>{message.time}</span>
                {message.direction === 'outbound' && (
                  <span className="text-emerald-300">
                    {message.status === 'read'
                      ? '✓✓'
                      : message.status === 'delivered'
                        ? '✓✓'
                        : '✓'}
                  </span>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="mr-auto bg-[#1E293B] border border-[#334155] rounded-2xl px-4 py-3 text-sm shadow-sm text-gray-400">
              escribiendo...
            </div>
          )}

          
        </div>

        {/* Input */}
        <div className="shrink-0 p-3 bg-[#0F172A] border-t border-[#1E293B] flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendText();
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full border border-[#334155] bg-[#111827] px-4 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            onClick={() => sendText()}
            className="rounded-full bg-emerald-600 text-white px-5 py-2 text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Enviar
          </button>
        </div>
      </main>
    </div>
  </div>
);
}