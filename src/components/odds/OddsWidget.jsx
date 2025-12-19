import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export default function OddsWidget({ sport, gameId }) {
  const [odds, setOdds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOdds();
    // Refresh every 2 minutes
    const interval = setInterval(fetchOdds, 120000);
    return () => clearInterval(interval);
  }, [sport, gameId]);

  const fetchOdds = async () => {
    try {
      const response = await base44.functions.invoke('getLiveOdds', { sportKey: sport });
      if (response.data.error) {
          throw new Error(response.data.error);
      }
      const data = response.data;
      setOdds(data);
    } catch (error) {
      console.error("Error fetching odds:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading odds...</div>;

  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold">Live Odds</span>
          <RefreshCw className="w-4 h-4 text-blue-600 cursor-pointer" onClick={fetchOdds} />
        </div>
        {/* Display odds here */}
      </CardContent>
    </Card>
  );
}