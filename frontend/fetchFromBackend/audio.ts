import z from "zod"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error("BACKEND_URL not defined in environment variables")
}

export type BackendReturnType = {
    success: boolean,
    message: string,
    description?: string
}

const transcriptSchema = z.object({
    transcription: z.string()
})

export async function transcribe(audioBlob: Blob): Promise<BackendReturnType> {
    try {
        const formData = new FormData()
        formData.append("file", audioBlob)

        const response = await fetch(`${BACKEND_URL}/audio/transcribe`, {
            method: "POST",
            body: formData
        })
        const jresponse = await response.json()
        console.log(`jresponse: ${jresponse}`)

        const parsedData = transcriptSchema.safeParse(jresponse)
        if (parsedData.error) {
            return {
                success: false,
                message: parsedData.error.message
            }
        }

        return {
            success: true,
            message: parsedData.data.transcription
        }
    } catch {
        return {
            success: false,
            message: "Unknow error occurred in backend"
        }
    }
}