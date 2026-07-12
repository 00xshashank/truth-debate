import z from "zod"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error("BACKEND_URL not defined in environment variables")
}

const signupResponseSchema = z.object({
    success: z.boolean(),
    message: z.string()
})

export type BackendReturnType = {
    success: boolean,
    message: string,
    description?: string
}

export async function createUser(name: string, username: string, email: string, password: string): Promise<BackendReturnType> {
    try {
        const response = await fetch(`${BACKEND_URL}/user/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify({
                name: name,
                username: username,
                email: email,
                password: password
            })
        })

        const data = await response.json()
        const parsedData = signupResponseSchema.safeParse(data)

        if (parsedData.error) {
            return {
                success: false,
                message: "Failed to parse data received from backend"
            }
        }

        if (!parsedData.data.success) {
            return {
                success: false,
                message: parsedData.data.message
            }
        }

        return {
            success: true,
            message: parsedData.data.message
        }
    } catch (err: unknown) {
        return {
            success: false,
            message: "Unknown error occurred in createUser function"
        }
    }
}