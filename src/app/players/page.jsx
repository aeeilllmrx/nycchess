"use client";

import { orderBy } from 'lodash';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const rankPlayers = (players, blitzRatingType, rapidRatingType) => {
  // convert ratings to numbers and filter out players with invalid ratings, default to 0 if invalid
  players.forEach(player => {
    player[blitzRatingType] = Number(player[blitzRatingType]) || 0;
    player[rapidRatingType] = Number(player[rapidRatingType]) || 0;
  });

  // sort and assign blitz and rapid ranks
  const blitzSortedPlayers = orderBy(players, [blitzRatingType], ['desc']);
  const rapidSortedPlayers = orderBy(players, [rapidRatingType], ['desc']);

  blitzSortedPlayers.forEach((player, index) => {
    player.RankBlitz = index + 1;
  });

  rapidSortedPlayers.forEach((player, index) => {
    player.RankRapid = index + 1;
  });

  return players;
};
export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHfkpjzf6lxKgpKCUa-f7CfvjHTiko34qrLe2WKeOGn46CaxeLMWea8fVSyMYV3iNDV3RMjC2HyRlT/pub?gid=985029476&single=true&range=A:Z&output=tsv"
        const response = await fetch(SHEET_URL);
        const text = await response.text();

        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: '\t',
        });

        const uniqueTeams = [...new Set(result.data.map(player => player.Team))].filter(Boolean);

        // rank players for both rapid and blitz
        const rankedData = rankPlayers(result.data, 'Rating_3', 'Rating_1');
        setTeams(uniqueTeams);
        setPlayers(rankedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlayers = players.filter(player =>
    (selectedTeam === 'all' || player.Team === selectedTeam) &&
        player.Name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <SelectValue placeholder="Filter by team"/>
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-500">
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded-md w-64"
        />
      </div>

      <Tabs defaultValue="blitz" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="blitz"
            className="px-4 py-2 rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700">
                        Blitz Ratings
          </TabsTrigger>
          <TabsTrigger value="rapid"
            className="px-4 py-2 rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700">
                        Rapid Ratings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blitz">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers
                .filter(player => player.RankBlitz) // make sure only valid ranks are used
                .sort((a, b) => a.RankBlitz - b.RankBlitz)
                .map((player) => (
                  <TableRow key={player.ID}>
                    <TableCell>{player.RankBlitz}</TableCell>
                    <TableCell>{player.ID.slice(1)}</TableCell>
                    <TableCell>{player.Name}</TableCell>
                    <TableCell>{player.Team}</TableCell>
                    <TableCell className="text-right">{player.Rating_3}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rapid">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers
                .filter(player => player.RankRapid) // make sure only valid ranks are used
                .sort((a, b) => a.RankRapid - b.RankRapid)
                .map((player) => (
                  <TableRow key={player.ID}>
                    <TableCell>{player.RankRapid}</TableCell>
                    <TableCell>{player.ID.slice(1)}</TableCell>
                    <TableCell>{player.Name}</TableCell>
                    <TableCell>{player.Team}</TableCell>
                    <TableCell className="text-right">{player.Rating_1}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">About Rankings</h2>
        <ul className="text-blue-700 space-y-1 list-disc list-inside">
          <li>Rankings are updated after each tournament</li>
          <li>Ratings are calculated using the Glicko-2 formula</li>
        </ul>
      </div>
    </div>
  );
}