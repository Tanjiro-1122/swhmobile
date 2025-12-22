Deno.serve(async (req) => {
  const manifest = {
    "name": "Sports Wager Helper",
    "short_name": "SWH",
    "id": "com.sportswagerhelper.app",
    "description": "AI-powered sports analytics and betting tools for smarter decisions.",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#200d44",
    "orientation": "portrait-primary",
    "categories": ["sports", "entertainment", "utilities"],
    "prefer_related_applications": false,
    "icons": [
      {
        "src": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg",
        "sizes": "192x192",
        "type": "image/jpeg",
        "purpose": "any"
      },
      {
        "src": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg",
        "sizes": "512x512",
        "type": "image/jpeg",
        "purpose": "any maskable"
      }
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400"
    }
  });
});