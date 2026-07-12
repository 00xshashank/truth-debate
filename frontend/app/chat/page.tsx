'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizonal } from "lucide-react"
import { useState } from "react"

async function sendMessage() {
    console.log("Send button was clicked")
}

export default function ChatPage() {
    const [ userInput, setUserInput ] = useState<string>("")

    return (
        <>
        <div className="flex justify-center items-center w-full">
            <div className="flex flex-col gap-5 m-5">
                <div className="text-lg font-bold text-center">
                    Ask away!
                </div>

                <div className="flex flex-row gap-2">
                    <Input
                        className="flex-1 w-md"
                        placeholder="Enter your query here"
                        value={userInput}
                        onChange={(e) => { setUserInput(e.target.value) }}
                    />
                    <Button onClick={sendMessage}><SendHorizonal /></Button>
                </div>
            </div>
        </div>
        </>
    )
}