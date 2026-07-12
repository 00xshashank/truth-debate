'use client'

import { useState } from "react"
import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import SignUpTab from "./SignUpTab";
import LogInTab from "./LogInTab";

import bg from '@/public/bg.png'

export default function AuthPage() {
    const [ showLogin, setShowLogin ] = useState<boolean>(true);

    const tabs = [
        {
            name: 'Log In',
            value: 'login',
            content: (
                <LogInTab />
            )
        },
        {
            name: 'Sign Up',
            value: 'signup',
            content: (
                <SignUpTab />
            )
        }
    ]

    return (
        <div className='flex items-center justify-center min-h-screen'>
            <Image
            src={bg}
            alt=""
            fill
            className="object-cover -z-10 opacity-50"
            style={{
                objectFit: "cover",
                opacity: 0.5
            }}
            />
            <Tabs defaultValue='login' className='gap-4'>
                <TabsList className='bg-background gap-1 border p-1'>
                    {tabs.map(tab => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className='data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent'
                        >
                            {tab.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="min-h-200">
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
