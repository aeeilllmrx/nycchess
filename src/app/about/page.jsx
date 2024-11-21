"use client";

import React from 'react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">About NYC Chess Clubs</h1>
      
      <div className="max-w-3xl space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            NYC Chess Club emerged from a simple yet powerful idea: to unite New York City&apos;s
            vibrant but fragmented chess community. While our city has always been a chess
            powerhouse, with many clubs across the five boroughs, we saw the need for
            a more connected, cohesive chess scene.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Unified Rating System</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            One of our key innovations is the introduction of a unified rating system that
            carries across all participating clubs. This means players can maintain a single,
            reliable rating whether they&apos;re playing in Brooklyn, Queens, or Manhattan. It&apos;s
            our way of ensuring fair competition and encouraging players to explore different
            clubs and playing styles.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Inter-Club Events</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We organize various inter-club competitions that bring together players from
              across the city:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
              <li>NYC Club Olympiad - Our flagship annual team competition</li>
              <li>Club vs Club Matches - Regular friendly competitions</li>
            </ul>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Community Building</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Beyond competition, we&apos;re creating a social scene where chess players can connect,
            learn, and grow together. Our network hosts regular social events, simultaneous exhibitions, 
            and casual meetups. We believe chess is not just a game of moves, but a way to 
            build lasting friendships and community bonds.

            Join our Discord server to learn more: <a href="https://discord.gg/tnM52bXX" className="text-blue-500">https://discord.gg/tnM52bXX</a>
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Join the Movement</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Whether you&apos;re a club looking to join our network, a player seeking
            new challenges, or someone interested in learning chess, you&apos;re welcome
            to be part of our growing community. Together, we&apos;re making New York City&apos;s
            chess scene more connected, competitive, and enjoyable for everyone.
          </p>
        </section>
      </div>
    </div>
  );
};