"use client";

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-BVrlSzBGwS4UtFbndn_XG6KhvbkvO219caOb6RPD9MH1RUfkENq53NokjYc2aDReybTuEp-RliZ-/pub?gid=0&single=true&output=tsv"
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: '\t',
        });

        const uniqueTeams = [...new Set(result.data.map(player => player.Team))].filter(Boolean);
        setTeams(uniqueTeams);
        setPlayers(result.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlayers = players.filter(player => 
    selectedTeam === 'all' || player.Team === selectedTeam
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Player Rankings</h1>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800">
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="blitz" className="w-full">
        <TabsList>
          <TabsTrigger value="blitz">Blitz Ratings</TabsTrigger>
          <TabsTrigger value="rapid">Rapid Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="blitz">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">RD</TableHead>
                <TableHead className="text-right">RV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.ID}>
                  <TableCell>{player.ID}</TableCell>
                  <TableCell>{player.Name}</TableCell>
                  <TableCell>{player.Team}</TableCell>
                  <TableCell className="text-right">{player.BlitzRating}</TableCell>
                  <TableCell className="text-right">{player.BlitzRD}</TableCell>
                  <TableCell className="text-right">{player.BlitzRV}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rapid">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">RD</TableHead>
                <TableHead className="text-right">RV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.ID}>
                  <TableCell>{player.ID}</TableCell>
                  <TableCell>{player.Name}</TableCell>
                  <TableCell>{player.Team}</TableCell>
                  <TableCell className="text-right">{player.RapidRating}</TableCell>
                  <TableCell className="text-right">{player.RapidRD}</TableCell>
                  <TableCell className="text-right">{player.RapidRV}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">About Rankings</h2>
        <ul className="text-blue-700 space-y-1 list-disc list-inside">
          <li>Rankings are updated within 24 hours after each tournament</li>
          <li>Ratings are calculated using the Glicko-2 formula</li>
        </ul>
      </div>
    </div>
  );
}