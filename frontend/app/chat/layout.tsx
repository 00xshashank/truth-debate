import React from "react"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import z from "zod"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { revalidatePath } from "next/cache"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error(`BACKEND_URL is not defined in .env`)
}

const userDetailsResponseSchema = z.object({
    properties: z.object({
        username: z.string().optional(),
        email: z.string().optional(),
        userid: z.number().optional()
    })
})

type UserDetails = z.infer<typeof userDetailsResponseSchema>

const chatListSchema = z.object({
    conversations: z.array(z.object({
        id: z.number(),
        title: z.string()
    }))
})

type ChatList = z.infer<typeof chatListSchema>

async function fetchUserDetails(token: string): Promise<UserDetails | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
            credentials: "include",
            headers: {
                "Cookie": `access_token=${token}`
            }
        })
        const jresponse = await response.json()

        const parsedData = userDetailsResponseSchema.safeParse(jresponse)
        if (parsedData.error) {
            console.log("Failed to parse data received from the backend")
            return null
        }

        console.log(`User details: username: ${parsedData.data.properties.username}`)

        if (!parsedData.data.properties.username || !parsedData.data.properties.email || !parsedData.data.properties.userid) {
            console.log("No such user found in the database")
            return null
        }

        return parsedData.data
    } catch (error) {
        console.log("Error occurred while fetching user data")
        return null
    }
}

async function fetchChatDetails(userid: number, token: string): Promise<ChatList | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/user/get-chats`, {
            headers: {
                "Cookie": `access_token=${token}`
            }
        })
        const jresponse = await response.json()

        const parsedData = chatListSchema.safeParse(jresponse)
        if (parsedData.error) {
            return null
        }

        return parsedData.data
    } catch (error) {
        console.log("Error occurred while fetching user data")
        return null
    }
}

async function createNewChat(token: string): Promise<number> {
    try {
        const response = await fetch(`${BACKEND_URL}/user/create-chat`, {
            headers: {
                "Cookie": `access_token=${token}`
            }
        })
        const jresponse = await response.json()

        const chatCreateResSchema = z.object({
            status: z.enum(["success", "failure"]),
            message: z.number()
        })
        const parsedData = chatCreateResSchema.safeParse(jresponse)

        if (parsedData.error || parsedData.data.status === "failure" || parsedData.data.message === -1) {
            console.log("Error while parsing data received from backend (createNewChat)")
            throw new Error("Error while parsing data received from backend (createNewChat)")
        }

        return parsedData.data.message
    } catch {
        console.log("Error while creating new chat")
    }

    return -1
}

export default async function ChatLayout(
    { children }: Readonly<{ children: React.ReactNode }>
) {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')

    if (!token) {
        redirect('/auth')
    }

    const userDetails = await fetchUserDetails(token.value)
    if (userDetails === null) {
        console.log("Failed to fetch user details")
    } else {
        console.log(`User details: username: ${userDetails.properties.username}`)
    }

    let chatList: ChatList | null = null;
    if (userDetails?.properties.userid) {
        chatList = await fetchChatDetails(userDetails.properties.userid, token.value)
        if (chatList === null) {
            console.log("Failed to fetch chat list")
        } else {
            chatList.conversations.forEach((chat) => {
                console.log(`Chat fetched: ${chat.id} --> ${chat.title}`)
            })
        }
    }

    async function newChatFn() {
        "use server"

        if (!token) {
            throw new Error("Tried to create new chat without being signed in")
        }

        const chatId =  await createNewChat(token.value)
        if (chatId != -1) {
            // chatList?.conversations.push({ id: chatId, title: "New Chat" })
            revalidatePath("/")
            redirect(`/chat/${chatId}`)
        }
    }

    return (
        <>
        {/* <div className="h-screen w-screen"> */}
            <SidebarProvider>
            <SidebarTrigger />
            
            <Sidebar>
                <SidebarHeader>
                    <div>
                        <Link href="/">Truth Debate</Link>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel> Chats </SidebarGroupLabel>

                        <SidebarGroupContent>
                            <div className="flex flex-col gap-3 text-base">
                            {
                                chatList !== null ? chatList.conversations.map((chat: { id: number, title: string }) => (
                                    <div key={chat.id.toString()}>
                                        <Link href={`/chat/${chat.id}`}> {chat.title} </Link>
                                    </div>
                                )) : (
                                    <div>Failed to fetch chats</div>
                                )
                            }
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <Button className="bg-black text-white m-2 rounded" onClick={newChatFn}>Create New Chat</Button>
                </SidebarContent>
            </Sidebar>
            
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            {children}
            </main>
            </SidebarProvider>
        {/* </div> */}
        </>
    )
}