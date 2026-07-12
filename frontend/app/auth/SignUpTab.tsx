'use client'

import { useState } from "react";

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

import { redirect } from "next/navigation";

import { createUser, BackendReturnType } from "@/fetchFromBackend/user";

export default function SignUpTab() {
    const [ name, setName ] = useState<string>("")
    const [ username, setUsername ] = useState<string>("")
    const [ email, setEmail ] = useState<string>("")
    const [ password, setPassword ] = useState<string>("")

    async function handleCreateUser() {
        const response = await createUser(name, username, email, password)

        if (response.success) {
            toast.success("User successfully created", {
                description: `Username: ${response.message}`
            })
            // redirect('/chat')
        } else {
            toast.error("User creation failed", {
                description: response.message
            })
        }

        setName("")
        setEmail("")
        setPassword("")
        setUsername("")
    }

    return (
        <>
            <Card className="w-100">
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <Label className="font-weight:900">Name</Label>
                    <Input placeholder="Enter name here" value={name} onChange={(e) => { setName(e.target.value) }} />
                    <Label className="font-weight:900">E-mail</Label>
                    <Input placeholder="Enter e-mail here" value={email} onChange={ (e) => { setEmail(e.target.value) }} />
                    <Label className="font-weight:900">Username</Label>
                    <Input placeholder="Enter username here" value={username} onChange={ (e) => { setUsername(e.target.value) }} />
                    <Label className="font-weight:900">Password</Label>
                    <Input placeholder="Enter password here" type="password" value={password} onChange={ (e) => { setPassword(e.target.value) }} />
                    <Button className="rounded-sm" onClick={handleCreateUser}>Login</Button>
                </div>
            </CardContent>
            </Card>
        </>
    )
}