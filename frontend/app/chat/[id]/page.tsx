'use client'

import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import { cva } from "class-variance-authority"
import { Input } from "@/components/ui/input"

import { fetchChatHistory, type MessageList } from "./utils"
import { Mic, SendHorizonal, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import z, { number } from "zod"

import { transcribe } from "@/fetchFromBackend/audio"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error("Backend url not defined in environment variables")
}

const headStyles = cva(["rounded text-white p-1 m-0"], {
    variants: {
        variant: {
            user: ["bg-gray-600 text-right self-end"],
            proponent: ["bg-green-600 self-start"],
            challenger: ["bg-orange-600 self-start"],
            judge: ["bg-purple-600 self-start"]
        }
    }
})

const messageStyles = cva(["rounded p-4"], {
    variants: {
        variant: {
            user: ["bg-gray-200 text-right self-end"],
            proponent: ["bg-green-200 self-start"],
            challenger: ["bg-orange-200 self-start"],
            judge: ["bg-purple-200 self-start"]
        }
    }
})

const chunkSchema = z.object({
    model: z.string(),
    role: z.string(),
    message: z.string()
})

export default function ChatMessagePage() {
    const { id } = useParams<{id: string}>()
    console.log(`Chat id: ${id}`)

    const [ userInput, setUserInput ] = useState<string>("")
    const [ messageList, setMessageList ] = useState<MessageList>([])
    const [ isRecording, setIsRecording ] = useState<boolean>(false)

    const [ audioUrl, setAudioUrl ] = useState<string>("")

    const mediaRecorderRef = useRef<MediaRecorder>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const audioCtxRef = useRef<AudioContext>(null)
    const analyserNodeRef = useRef<AnalyserNode>(null)
    const canvasDrawIdRef = useRef<number>(0)

    async function sendMessage() {
        setUserInput("")

        if (!userInput.trim()) {
            toast.error("Please enter an input before sending a message")
            return
        }

        setMessageList((prev) => (
            [
                ...prev,
                {
                    messageIndex: prev.length,
                    sender: "user",
                    role: "user",
                    message: userInput
                }
            ]
        ))

        try {
            const response = await fetch(`${BACKEND_URL}/user/${id}/message`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "prompt": userInput
                })
            })

            if (!response.body) {
                toast.error("Error while fetching reply from backend: No response body found")
                throw new Error("Error while fetching reply from backend: No response body found")
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            let done: boolean = false, model: string = "", role: string = ""
            while (!done) {
                const chunk = await reader.read()
                done = chunk.done
                const alltext = decoder.decode(chunk.value, { stream: true }).trim()

                for (const text of alltext.split('\n')) {
                    const ttext = text.trim()

                    if (ttext) {
                        const jtext = JSON.parse(ttext)
                        const parsedData = chunkSchema.safeParse(jtext)
                        if (parsedData.error) {
                            throw new Error("Error while decoding message using zod")
                        }
                        const data = parsedData.data
                        console.log(`Received chunk: role: ${data.role}, `)
                        if (data.role !== role) {
                            model = data.model
                            role = data.role
                            setMessageList((prev) => {
                                const msgList = [...prev]
                                msgList.push({
                                    messageIndex: msgList.length,
                                    sender: data.model,
                                    role: data.role,
                                    message: data.message
                                })
                                msgList.sort((a, b) => {
                                    if (a.messageIndex > b.messageIndex) {
                                        return 1
                                    }
                                    if (a.messageIndex < b.messageIndex) {
                                        return -1
                                    }
                                    return 0
                                })
                                return msgList
                            })
                        } else {
                            setMessageList((prev) => (
                                prev.map((msg) => (
                                    msg.messageIndex === prev.length-1 ? 
                                    { ...msg, message: msg.message + data.message } : msg
                                ))
                            ))
                        }
                    }
                }
            }
        } catch {
            console.log("Error while trying to send message to backend")
        }
    }

    async function startAudioRecord() {
        showUserAudio()

        const stream = await navigator.mediaDevices.getUserMedia({ "audio": true })
        const mediaRecorder = new MediaRecorder(stream)

        if (!audioCtxRef.current) {
            throw new Error("Audio context ref is not defined when startAudioRecord called")
        }
        if (!analyserNodeRef.current) {
            throw new Error("Analyser node ref is not defined when startAudioRecord called")
        }

        const source = audioCtxRef.current.createMediaStreamSource(stream)
        source.connect(analyserNodeRef.current)

        mediaRecorder.ondataavailable = (ev: BlobEvent) => {
            audioChunksRef.current.push(ev.data)
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { "type": "audio/webm" })
            const url = URL.createObjectURL(audioBlob)
            console.log(`Audio chunk URL: ${url}`)
            setAudioUrl(url)
        }

        mediaRecorder.onerror = (ev: ErrorEvent) => {
            console.log("Media recording from stream encountered error, so clearing the chunks array")
            audioChunksRef.current = []
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorderRef.current.start()
        setIsRecording(true)
    }

    function stopAudioRecord() {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
        } else {
            throw new Error("stopAudioRecord called with null mediaRecorderRef")
        }

        cancelShowUserAudio()
        setIsRecording(false)
    }

    function handleVoiceInput() {
        console.log("function handleVoiceInput called")
        if (!isRecording) {
            startAudioRecord()
        } else {
            stopAudioRecord()
        }
    }

    async function getTranscription() {
        const transcription = await transcribe(new Blob(audioChunksRef.current, { "type": "audio/webm" }))
        if (!transcription.success) {
            toast.error("Failed to get transcription", {
                description: transcription.message
            })
        }

        setUserInput((prev) => {
            return prev + transcription.message
        })
    }

    function cancelShowUserAudio() {
        cancelAnimationFrame(canvasDrawIdRef.current)
    }

    function showUserAudio() {
        if (!analyserNodeRef.current) {
            throw new Error("Analyser node ref is not defined when showUserAudio is called")
        }

        canvasDrawIdRef.current = requestAnimationFrame(showUserAudio)

        const canvas = canvasRef.current
        if (!canvas) {
            throw new Error("function showUserAudio called before canvasRef.current exists")
        }

        const canvasCtx = canvas.getContext("2d")
        if (!canvasCtx) {
            throw new Error("Failed to get canvas context")
        }

        const dataArray = new Uint8Array(2048)
        analyserNodeRef.current.getByteTimeDomainData(dataArray)

        canvasCtx.fillStyle = "#ff0000"
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

        canvasCtx.lineWidth = 2
        canvasCtx.strokeStyle = "#000000"
        canvasCtx.beginPath()

        for (let i=0; i<2048; i++) {
            const x = (canvas.width / 2048) * i
            const y = dataArray[i]

            if (i === 0) {
                canvasCtx.moveTo(x, y)
            } else {
                canvasCtx.lineTo(x, y)
            }
        }

        canvasCtx.stroke()
    }

    useEffect(() => {
        async function fetchMessages() {
            const nid = Number.parseInt(id)
            setMessageList(await fetchChatHistory(nid))
        }

        fetchMessages()

        audioCtxRef.current = new AudioContext()
        analyserNodeRef.current = audioCtxRef.current.createAnalyser()

        analyserNodeRef.current.fftSize = 2048
        analyserNodeRef.current.minDecibels = -90
        analyserNodeRef.current.maxDecibels = -10
    }, [])
    
    return (
        <>
            <div className="flex flex-col gap-5 h-full flex-1 relative p-5 w-full">
                <div className="flex flex-col w-full flex-1 overflow-y-auto gap-5">
                { messageList.map((msg) => {
                    let msgstyles: string, hstyles: string
                    if (msg.role === "user") {
                        hstyles = headStyles({ variant: "user" })
                        msgstyles = messageStyles({ variant: "user" })
                    } else if (msg.role === "proponent") {
                        hstyles = headStyles({ variant: "proponent" })
                        msgstyles = messageStyles({ variant: "proponent" })
                    } else if (msg.role === "challenger") {
                        hstyles = headStyles({ variant: "challenger" })
                        msgstyles = messageStyles({ variant: "challenger" })
                    } else {
                        hstyles = headStyles({ variant: "judge" })
                        msgstyles = messageStyles({ variant: "judge" })
                    }
                    return (
                        <div key={Math.random().toString()} className={`flex flex-col gap-3 ${msgstyles}`}>
                            <div className={`${hstyles}`}>Message sent by: {msg.sender}, Role: {msg.role}</div>
                            <Markdown>{msg.message}</Markdown>
                        </div>
                    )
                })}
                </div>

                <div className="flex flex-col gap-3">
                    <div>
                        <canvas className="w-full h-50" style={{ display: isRecording ? "block" : "none" }} ref={canvasRef}></canvas>
                    </div> 
                    {/* className={`${isRecording ? "visible" : "invisible"}`} */}

                    <div className="flex flex-row gap-1 shrink-0">
                        <Input 
                            value={userInput}
                            onChange={(e) => { setUserInput(e.target.value) }}
                            placeholder="Enter your query here" 
                            className="w-full"
                        />
                        <Button onClick={handleVoiceInput} variant={isRecording ? "destructive" : "default"}>
                            {isRecording ? <MicOff /> : <Mic />}
                        </Button>

                        {
                            audioChunksRef.current.length !== 0 &&
                            <Button onClick={getTranscription}>
                                Transcribe
                            </Button>
                        }
                        <Button onClick={sendMessage}>
                            <SendHorizonal />
                        </Button>

                        <div>
                            {
                                audioUrl && <audio src={audioUrl} controls></audio>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}