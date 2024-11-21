"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-BVrlSzBGwS4UtFbndn_XG6KhvbkvO219caOb6RPD9MH1RUfkENq53NokjYc2aDReybTuEp-RliZ-/pub?gid=796731803&single=true&output=csv"
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setClubs(results.data);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const boroughs = ["All", ...new Set(clubs.map(club => club.borough))];
  
  const filteredClubs = clubs.filter(club => 
    selectedBorough === "All" || club.borough === selectedBorough
  );

  if (loading) {
    return <div className="p-6">Loading clubs...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">NYC Chess Club</h1>
      
      <div className="mb-6">
        <Select value={selectedBorough} onValueChange={setSelectedBorough}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select borough" />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-500">
            {boroughs.map(borough => (
              <SelectItem key={borough} value={borough}>
                {borough}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredClubs.map(club => (
          <Card key={club.id}>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">{club.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                <div>
                  <p><span className="font-medium">Venue:</span> {club.venue}</p>
                  <p><span className="font-medium">Location:</span> {club.location}, {club.borough}</p>
                  <p><span className="font-medium">Schedule:</span> {club.schedule}</p>
                </div>
                <div>
                  <p><span className="font-medium">Contact:</span> {club.contact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};