import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { sub } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // 1. Calculate Bot Accuracy
        const { data: outcomes, error: outcomesError } = await base44.asServiceRole.entities.PredictionOutcome.list();
        if (outcomesError) throw new Error(`Failed to fetch outcomes: ${outcomesError.message}`);
        
        let botAccuracy = 0;
        if (outcomes && outcomes.length > 0) {
            const correctPredictions = outcomes.filter(o => o.was_correct).length;
            botAccuracy = (correctPredictions / outcomes.length) * 100;
        }

        // 2. Calculate User Profit (24h)
        const twentyFourHoursAgo = sub(new Date(), { hours: 24 }).toISOString();
        const { data: bets, error: betsError } = await base44.asServiceRole.entities.TrackedBet.filter({
            settled_date: { $gte: twentyFourHoursAgo }
        });
        if (betsError) throw new Error(`Failed to fetch bets: ${betsError.message}`);

        let userProfit24h = 0;
        if (bets) {
            userProfit24h = bets.reduce((acc, bet) => acc + (bet.actual_profit || 0), 0);
        }

        // 3. Calculate Live Insights (active matches for today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: matches, error: matchesError } = await base44.asServiceRole.entities.Match.filter({
             match_date: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() }
        });
        if(matchesError) throw new Error(`Failed to fetch matches: ${matchesError.message}`);

        const liveInsights = matches ? matches.length : 0;

        // Return combined stats
        const response = {
            botAccuracy: parseFloat(botAccuracy.toFixed(1)),
            userProfit24h: userProfit24h,
            liveInsights: liveInsights
        };

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});