'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useRef, useEffect } from "react";

const HEALTH_ENDPOINT = "http://localhost:8000/health"
const WS_URL = "ws://localhost:8000/transcribe"

export default function SampleAudioPage () {
    const [ isRecording, setIsRecording ] = useState<boolean>(false)
    const [ audioUrl, setAudioUrl ] = useState<string | null>(null)
    const [ transcribed, setTranscribed ] = useState<string>("")
    const [ connectionFailed, setConnectionFailed ] = useState<boolean>(false)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)

    const chunksRef = useRef<Blob[]>([])
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const wsConnectionRef = useRef<WebSocket | null>(null)

    async function initWsConnection () {
        const health = await fetch(`${HEALTH_ENDPOINT}`)
        const status = await health.text()
        console.log(`Text received from health endpoint: ${status}`)
        if (status != `"OK"`) {
            return false
        }

        const wsConnection = new WebSocket(WS_URL)
        
        wsConnection.onopen = () => {
            console.log("Opened ws connection")
        }

        wsConnection.onclose = () => {
            console.log("Connection closed")
        }

        wsConnection.onerror = () => {
            console.log("Error in ws connection")
        }

        wsConnection.onmessage = (ev: MessageEvent) => {
            console.log(`Text content received: ${ev.data}`)
            setTranscribed((prev) => prev + ev.data)
        }

        wsConnectionRef.current = wsConnection
        return true
    }

    async function waitForConnection() {
        const ready = await initWsConnection()
        
        if (!ready) {
            throw new Error("Transcription endpoint dead")
        }

        if (wsConnectionRef.current === null) {
            throw new Error("wsConnectionRef.current is null")
        }

        if (wsConnectionRef.current?.readyState === WebSocket.OPEN) {
            return Promise.resolve()
        }

        return new Promise<void>((resolve, reject) => {
            const onOpen = () => {
                console.log("Websocket connection connected")
                cleanUp()
                resolve()
            }

            const onError = () => {
                console.log("Connection failed")
                cleanUp()
                reject()
            }

            const cleanUp = () => {
                wsConnectionRef.current?.removeEventListener("open", onOpen)
                wsConnectionRef.current?.removeEventListener("error", onError)
            }

            wsConnectionRef.current?.addEventListener("open", onOpen)
            wsConnectionRef.current?.addEventListener("error", onError)
        })
    }

    async function startRecordingAudio() {
        if (!audioCtxRef.current || !analyserRef.current) {
            throw new Error("Audio context ref or analyzer ref are null")
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setIsRecording(true)

        const source = audioCtxRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)

        analyserRef.current.minDecibels = -80
        analyserRef.current.maxDecibels = -10
        analyserRef.current.fftSize = 2048

        const mediaRecorder = new MediaRecorder(stream)

        mediaRecorder.ondataavailable = ((event: BlobEvent) => {
            console.log("Received chunk data")
            chunksRef.current.push(event.data)
            const dataArray = new Uint8Array(2048)
            analyserRef.current?.getByteTimeDomainData(dataArray)
            console.log(`First few values: max: ${dataArray[1]})}, min: ${dataArray[1]}, ${dataArray[2]}, ${dataArray[3]}`)
        })

        mediaRecorder.onstop = (() => {
            console.log("Stopped recording")
            console.log(`Number of chunks: ${chunksRef.current.length}`)
            const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)
        })

        mediaRecorderRef.current = mediaRecorder
        mediaRecorderRef.current.start()
        startDrawing()
    }

    function stopRecordingAudio() {
        stopDrawing()
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
    }

    async function sendAudio() {
        await waitForConnection()
        .then(() => {
            console.log(`Executing then function`)
            console.log(`Sending data...`)
            wsConnectionRef.current?.send(new Blob(chunksRef.current, { type: "audio/webm" }))
        }).catch(() => {
            console.log(`Connection failed`)
            setConnectionFailed(true)
        })
    }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawingRef = useRef<number>(0)

    function startDrawing() {
        console.log("Function startDrawing called")
        drawingRef.current = requestAnimationFrame(startDrawing)

        const canvas = canvasRef.current
        if (!canvas) {
            console.log("Canvas is absent, so exiting useEffect")
            throw new Error("Canvas is absent, so exiting useEffect")
        }

        const canvasCtx = canvas.getContext("2d")
        if (!canvasCtx) {
            console.log("Failed to get canvas context")
            throw new Error("Failed to get canvas context")
        }

        canvasCtx.fillStyle = '#ff0000'
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

        const width = canvas.width
        const height = canvas.height
        console.log(`Height: ${height}, width: ${width}`)

        canvasCtx.lineWidth = 2
        canvasCtx.strokeStyle = "rgb(0, 0, 0)"
        canvasCtx.beginPath()

        const data = new Uint8Array(2048)
        analyserRef.current?.getByteTimeDomainData(data)
        console.log(`Fiirst few values: ${data[0]}, ${data[1]}, ${data[2]}, ${data[3]}`)

        const npoints = data.length

        for (let i=0; i<npoints; i++) {
            const x = i * (width / npoints)
            const y = (data[i] / 128) * height

            if (i === 0) {
                canvasCtx.moveTo(x, y)
            } else {
                canvasCtx.lineTo(x, y)
            }
        }

        canvasCtx.stroke()
    }

    function stopDrawing() {
        cancelAnimationFrame(drawingRef.current)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            console.log("Canvas is absent, so exiting useEffect")
            throw new Error("Canvas is absent, so exiting useEffect")
        }

        const canvasCtx = canvas.getContext("2d")
        if (!canvasCtx) {
            console.log("Failed to get canvas context")
            throw new Error("Failed to get canvas context")
        }

        canvasCtx.fillStyle = '#ff0000'
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

        audioCtxRef.current = new AudioContext()
        analyserRef.current = audioCtxRef.current.createAnalyser()
    }, [])

    return (
        <>
            <div className="flex flex-col gap-15">
                <div className="flex flex-col gap-4">
                    { !isRecording ? (
                        <button onClick={startRecordingAudio}>Start Recording</button>
                    ) : (
                        <button onClick={stopRecordingAudio}>Stop Recording</button>
                    )}
                    { audioUrl && (
                        <audio controls src={audioUrl} />
                    )}
                    <Button onClick={sendAudio}>Send Audio</Button>
                    <div> Transcribed text: {transcribed} </div>
                </div>

                <canvas className="w-[500px] h-[500px]" ref={ canvasRef }></canvas>
            </div>
        </>
    )
}