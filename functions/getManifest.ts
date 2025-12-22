Deno.serve(async (req) => {
  // Base URL for the app
  const baseUrl = "https://sportswagerhelper.base44.app";
  
  // New SWH Logo
  const iconUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/a74a99ab3_logo2.png";

  const manifest = {
    "name": "Sports Wager Helper",
    "short_name": "SWH",
    "id": "/",
    "description": "AI-powered sports analytics and betting insights. Get match predictions, player stats, team analysis, live odds comparison, and smart betting tools.",
    "start_url": "/",
    "scope": "/",
    "dir": "ltr",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#ffffff",
    "orientation": "any",
    "categories": ["sports", "entertainment", "utilities"],
    "icons": [
      {
        "src": iconUrl,
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": iconUrl,
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": iconUrl,
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "screenshots": [
      {
        "src": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png",
        "sizes": "1280x720",
        "type": "image/png",
        "form_factor": "wide",
        "label": "Dashboard with AI-powered sports predictions"
      }
    ],
    "shortcuts": [
      {
        "name": "Dashboard",
        "short_name": "Home",
        "description": "Go to your dashboard",
        "url": "/Dashboard",
        "icons": [{ "src": iconUrl, "sizes": "192x192" }]
      },
      {
        "name": "Player Stats",
        "short_name": "Players",
        "description": "Search player statistics",
        "url": "/PlayerStats",
        "icons": [{ "src": iconUrl, "sizes": "192x192" }]
      },
      {
        "name": "Team Stats",
        "short_name": "Teams",
        "description": "Analyze team performance",
        "url": "/TeamStats",
        "icons": [{ "src": iconUrl, "sizes": "192x192" }]
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