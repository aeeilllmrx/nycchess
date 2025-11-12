"use client";

import { orderBy } from 'lodash';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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
  const [sortBy, setSortBy] = useState('id'); // 'id', 'blitz', or 'rapid'


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/players');
        const data = await response.json();

        if (response.ok) {
          const uniqueTeams = [...new Set(data.map(player => player.Team))].filter(Boolean);
          const rankedData = rankPlayers(data, 'Rating_3', 'Rating_1');
          setTeams(uniqueTeams);
          setPlayers(rankedData);
        } else {
          console.error('Error fetching data:', data.error);
        }
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

  // Sort players based on selected sort option
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'id') {
      // Compare IDs numerically
      const numA = parseInt(a.ID) || 0;
      const numB = parseInt(b.ID) || 0;
      return numA - numB;
    } else if (sortBy === 'blitz') {
      return b.Rating_3 - a.Rating_3; // descending
    } else if (sortBy === 'rapid') {
      return b.Rating_1 - a.Rating_1; // descending
    }
    return 0;
  });

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

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Sort by"/>
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-500">
            <SelectItem value="id">Sort by ID</SelectItem>
            <SelectItem value="blitz">Sort by Blitz (Highest)</SelectItem>
            <SelectItem value="rapid">Sort by Rapid (Highest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Blitz Rating</TableHead>
            <TableHead className="text-right">Rapid Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player) => (
            <TableRow key={player.ID}>
              <TableCell>{player.ID}</TableCell>
              <TableCell>{player.Name}</TableCell>
              <TableCell>{player.Team}</TableCell>
              <TableCell className="text-right">{Math.round(player.Rating_3)}</TableCell>
              <TableCell className="text-right">{Math.round(player.Rating_1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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