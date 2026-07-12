'use client'

import { useState } from "react";
import { redirect } from "next/navigation";
import z from "zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { fetchToken, BackendReturnType } from "@/fetchFromBackend/auth";

const userDataSchema = z.object({
    username: z.string(),
    email: z.string(),
    userid: z.number()
});

export default function LogInTab() {
    const [ username, setUsername ] = useState<string>("")
    const [ password, setPassword ] = useState<string>("")

    async function sendLoginRequest() {
        const returnedValue = await fetchToken(username, password)

        if (returnedValue.success) {
            toast.success("Login successful")
            redirect('/chat')
        } else {
            toast.error(returnedValue.message, {
                description: returnedValue.description ?? ""
            })
        }

        setUsername("")
        setPassword("")
    }
    
    return (
        <>
            <Card className="w-100">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <Label className="font-weight:900">Username</Label>
                    <Input placeholder="Enter username here" value={username} onChange={(e) => { setUsername(e.target.value) }} />
                    <Label className="font-weight:900">Password</Label>
                    <Input placeholder="Enter password here" type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} />
                    <Button className="rounded-sm" onClick={sendLoginRequest}>Login</Button>
                </div>
            </CardContent>
            </Card>
        </>
    )
}