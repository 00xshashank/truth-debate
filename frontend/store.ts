import { create } from 'zustand'

import z from 'zod'

const messageListSchema = z.array(z.object({
    messageIndex: z.number(),
    sender: z.string(),
    message: z.string(),
    role: z.string(),
    processed: z.boolean()
}))

export type MessageList = z.infer<typeof messageListSchema>

type MessageStore = {
    messages: Map<number, MessageList>,
    addChat: (chatId: number, message: string) => void,
    addMessage: (chatId: number, sender: string, message: string) => void
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error(`BACKEND_URL is not defined in .env`)
}

const createChatResponseSchema = z.object({
    status: z.enum(["success", "failure"]),
    message: z.number()
})

export const useMessageStore = create<MessageStore>((set) => ({
    messages: new Map<number, MessageList>(),

    addChat: async (chatId: number, message: string) => {
        try {
            set((state) => {
                state.messages.set(chatId, [{
                    messageIndex: 0,
                    sender: "user",
                    role: "user",
                    message: message,
                    processed: false
                }])
                return state
            })
        } catch {
            console.log("Error while fetching messages from backend")
        }
    },

    addMessage: (chatId: number, sender: string, message: string) => {
        set((state) => {
            const prev = state.messages.get(chatId)
            if (!prev || prev.length === 0) {
                throw new Error(`Attempted to add message: ${message} to chat with 0 messages(${chatId}). To add a new chat, use addChat first`)
            }

            state.messages.set(chatId, [
                ...prev,
                {
                    messageIndex: prev.length,
                    sender: sender,
                    role: "user",
                    message: message,
                    processed: true
                }
            ])
            return state
        })
    }
}))