"use client"
import React from "react";
import Link from "next/link";

export default function HomePage(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 text-white overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.35),transparent_70%)]"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <h1 className="text-2xl font-bold tracking-wide">
          Ink<span className="text-purple-300">AI</span>
        </h1>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 mt-24">
        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight animate-fade-in">
          Turn Ideas Into
          <span className="block text-purple-300">Living Tattoos</span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-purple-100 animate-fade-in delay-150">
          Generate AI-powered tattoo designs, translate them back into
          meaningful text, and hear the story behind your ink as audio.
        </p>

        <Link href={'/dashboard/Text-To-Tattoo'} className="mt-10 px-8 py-4 rounded-xl bg-purple-300 text-purple-900 font-semibold text-lg hover:bg-purple-200 transition-all duration-300 shadow-lg hover:scale-105 animate-bounce-slow">
          Generate Your Tattoo
        </Link>
      </section>

      {/* Features */}
      <section className="relative z-10 mt-32 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-purple-800/40 backdrop-blur rounded-2xl p-6 hover:scale-105 transition duration-300">
          <h3 className="text-xl font-bold text-purple-200">
            🎨 Tattoo Generator
          </h3>
          <p className="mt-3 text-purple-100">
            Describe your idea and let AI generate a unique tattoo design just
            for you.
          </p>
        </div>

        <div className="bg-purple-800/40 backdrop-blur rounded-2xl p-6 hover:scale-105 transition duration-300">
          <h3 className="text-xl font-bold text-purple-200">
            📝 Image to Meaning
          </h3>
          <p className="mt-3 text-purple-100">
            Translate tattoo imagery back into text to understand its deeper
            symbolism.
          </p>
        </div>

        <div className="bg-purple-800/40 backdrop-blur rounded-2xl p-6 hover:scale-105 transition duration-300">
          <h3 className="text-xl font-bold text-purple-200">
            🔊 Audio Story
          </h3>
          <p className="mt-3 text-purple-100">
            Listen to your tattoo’s story through AI-generated voice narration.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-32 pb-8 text-center text-purple-200">
        <p>© 2026 InkAI — Tattoos with Meaning</p>
      </footer>
    </div>
  );
};


