import z from "zod"
import { useMessageStore } from "@/store"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error(`BACKEND_URL is not defined in .env`)
}

const messageListSchema = z.array(z.object({
    messageIndex: z.number(),
    sender: z.string(),
    role: z.string(),
    message: z.string()
}))

const messageListResponseSchema = z.object({
    messages: messageListSchema
})

export type MessageList = z.infer<typeof messageListSchema>

async function fetchChatHistoryFomBackend(id: number): Promise<MessageList> {
    try {
        const response = await fetch(`${BACKEND_URL}/user/chat/${id}`, {
            credentials: "include"
        })
        console.log(`Response received`)
        const jresponse = await response.json()
        console.log(`Parsed response from backend: ${jresponse['messages']}`)

        const parsedData = messageListResponseSchema.safeParse(jresponse)
        if (parsedData.error) {
            console.log("Error while parsing data from the backend")
            throw new Error("")
        }

        console.log(`Data received from backend: ${parsedData.data}`)
        return parsedData.data.messages
    } catch {
        console.log(`Error while fetching message history for chat: ${id}`)
        return []
    }
}

async function fetchChatHistoryFromMap(id: number) {
    const messageMap = useMessageStore((store) => store.messages)
    const msglist = messageMap.get(id)
    return (msglist) ? msglist : null;
}

export async function fetchChatHistory(id: number): Promise<MessageList> {
    return fetchChatHistoryFomBackend(id)
}