import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function should be called by a cron job or scheduled task
        // For now, it can be manually triggered or called periodically
        
        // Get all active alerts
        const alerts = await base44.asServiceRole.entities.Alert.filter({ is_active: true });

        const triggeredAlerts = [];

        for (const alert of alerts) {
            let shouldTrigger = false;
            let alertMessage = '';

            // Check different alert types
            if (alert.alert_type === 'odds_change') {
                // Use AI to check current odds vs trigger condition
                const checkResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Check if the following betting condition is met: "${alert.trigger_condition}" for match: "${alert.match_description}". 
                    Use current live odds data from the internet. Respond with JSON indicating if condition is met and the current odds.`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            condition_met: { type: "boolean" },
                            current_odds: { type: "string" },
                            explanation: { type: "string" }
                        }
                    }
                });

                if (checkResult.condition_met) {
                    shouldTrigger = true;
                    alertMessage = `🚨 Odds Alert: ${alert.match_description} - ${checkResult.explanation}`;
                }
            } else if (alert.alert_type === 'injury_report') {
                // Check for injury updates
                const checkResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Check for any injury updates for: "${alert.match_description}". 
                    Search recent news and injury reports. Respond with JSON.`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            has_update: { type: "boolean" },
                            injury_details: { type: "string" }
                        }
                    }
                });

                if (checkResult.has_update) {
                    shouldTrigger = true;
                    alertMessage = `🏥 Injury Update: ${alert.match_description} - ${checkResult.injury_details}`;
                }
            } else if (alert.alert_type === 'game_start') {
                // Check if game is starting soon (within 1 hour)
                const checkResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Check if the game "${alert.match_description}" is starting within the next hour. 
                    Use current time and game schedules from the internet.`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            starting_soon: { type: "boolean" },
                            start_time: { type: "string" }
                        }
                    }
                });

                if (checkResult.starting_soon) {
                    shouldTrigger = true;
                    alertMessage = `⏰ Game Starting Soon: ${alert.match_description} at ${checkResult.start_time}`;
                }
            }

            if (shouldTrigger) {
                // Get user's push subscriptions
                const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
                    created_by: alert.created_by,
                    is_active: true
                });

                // Send push notifications (would require FCM integration)
                // For now, send email as fallback
                try {
                    await base44.integrations.Core.SendEmail({
                        to: alert.created_by,
                        subject: 'Sports Wager Helper Alert',
                        body: alertMessage
                    });

                    // Update alert
                    await base44.asServiceRole.entities.Alert.update(alert.id, {
                        triggered_count: (alert.triggered_count || 0) + 1,
                        last_triggered: new Date().toISOString()
                    });

                    triggeredAlerts.push({
                        alert_id: alert.id,
                        message: alertMessage,
                        user: alert.created_by
                    });
                } catch (emailError) {
                    console.error('Failed to send alert email:', emailError);
                }
            }
        }

        return Response.json({ 
            success: true, 
            checked: alerts.length,
            triggered: triggeredAlerts.length,
            alerts: triggeredAlerts
        });
    } catch (error) {
        console.error('Check alerts error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});