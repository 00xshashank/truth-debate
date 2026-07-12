const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BACKEND_URL) {
    throw new Error("BACKEND_URL not defined in environment variables")
}

export type BackendReturnType = {
    success: boolean,
    message: string,
    description?: string
}

export async function fetchToken(username: string, password: string): Promise<BackendReturnType> {
    try {
        const formData = new URLSearchParams()
        formData.append("username", username)
        formData.append("password", password)

        const response = await fetch(`${BACKEND_URL}/auth/token`, {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        })

        if (!response.ok) {
            return {
                success: false,
                message: "Error occurred in fetchToken",
                description: "Backend returned non-200 status code"
            }
        }

        const text = await response.text()

        if (text === `"OK`) {
            return {
                success: true,
                message: "Login successful"
            }
        } else {
            return {
                success: true,
                message: "Login successful"
            }
        }
    } catch(error: unknown) {
        return {
            success: false,
            message: "Unknown error occurred in fetchToken",
        }
    }
}
