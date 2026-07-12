'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <nav className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                            M
                        </div>
                        <div>
                            <h1 className="font-semibold text-slate-900">
                                MediAssist AI
                            </h1>
                            <p className="text-xs text-slate-500">
                                Intelligent Medical Conversations
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href="auth">
                                Login
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href="/auth">
                                Sign Up
                            </Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="mx-auto max-w-7xl px-6 py-24">
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                            AI-Powered Medical Intelligence
                        </div>

                        <h1 className="mb-6 text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
                            Smarter Medical
                            <span className="text-emerald-600">
                                {" "}Research,
                            </span>
                            <br />
                            Analysis & Consultation
                        </h1>

                        <p className="mb-8 max-w-xl text-lg text-slate-600">
                            Accelerate clinical research, explore medical
                            literature, analyze patient cases, and collaborate
                            with specialized AI medical experts through
                            structured debates and evidence-based reasoning.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button size="lg" asChild>
                                <Link href="/auth">
                                    Start Free
                                </Link>
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                asChild
                            >
                                <Link href="auth">
                                    Sign In
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Mock Medical Dashboard */}
                    <div className="rounded-3xl border bg-white p-6 shadow-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-red-400" />
                            <div className="h-3 w-3 rounded-full bg-yellow-400" />
                            <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl bg-slate-100 p-4">
                                <div className="font-medium text-slate-800">
                                    Clinical Query
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    Compare current evidence regarding
                                    anticoagulation management in atrial
                                    fibrillation patients...
                                </p>
                            </div>

                            <div className="ml-auto w-[90%] rounded-xl bg-emerald-600 p-4 text-white">
                                <div className="font-medium">
                                    Evidence Analysis
                                </div>
                                <p className="mt-2 text-sm opacity-90">
                                    Reviewing clinical guidelines,
                                    meta-analyses, and recent literature...
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-100 p-4">
                                <div className="font-medium text-slate-800">
                                    Medical Literature Search
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    14 relevant studies identified with
                                    supporting evidence.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-bold text-slate-900">
                            Built for Healthcare Professionals
                        </h2>
                        <p className="mt-4 text-slate-600">
                            Designed to support medical reasoning,
                            research, and evidence synthesis.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            title="Clinical Research"
                            description="Explore and summarize medical literature, guidelines, and publications."
                        />

                        <FeatureCard
                            title="Differential Diagnosis"
                            description="Compare possible diagnoses and reasoning pathways."
                        />

                        <FeatureCard
                            title="Expert Debate"
                            description="Multiple specialized AI experts analyze difficult cases."
                        />

                        <FeatureCard
                            title="Evidence Review"
                            description="Review supporting and opposing evidence from medical sources."
                        />
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-emerald-600 py-20 text-white">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-8 text-center md:grid-cols-4">
                        <StatCard
                            value="24/7"
                            label="Research Assistance"
                        />

                        <StatCard
                            value="Multi-Agent"
                            label="Medical Experts"
                        />

                        <StatCard
                            value="Evidence"
                            label="Focused Analysis"
                        />

                        <StatCard
                            value="Secure"
                            label="User Accounts"
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h2 className="mb-6 text-4xl font-bold text-slate-900">
                        Start Exploring Medical Knowledge Today
                    </h2>

                    <p className="mb-8 text-lg text-slate-600">
                        Join clinicians, researchers, and students using AI
                        to navigate complex medical information.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link href="/auth">
                                Create Account
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                        >
                            <Link href="auth">
                                Login
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-white">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="font-semibold">
                                MediAssist AI
                            </h3>
                            <p className="text-sm text-slate-500">
                                Medical intelligence platform
                            </p>
                        </div>

                        <div className="text-sm text-slate-500">
                            For educational and research purposes.
                            Not a substitute for professional medical judgment.
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    )
}

function FeatureCard({
    title,
    description,
}: {
    title: string
    description: string
}) {
    return (
        <div className="rounded-2xl border bg-slate-50 p-6">
            <h3 className="mb-3 text-xl font-semibold">
                {title}
            </h3>
            <p className="text-slate-600">
                {description}
            </p>
        </div>
    )
}

function StatCard({
    value,
    label,
}: {
    value: string
    label: string
}) {
    return (
        <div>
            <div className="text-4xl font-bold">
                {value}
            </div>
            <div className="mt-2 opacity-90">
                {label}
            </div>
        </div>
    )
}