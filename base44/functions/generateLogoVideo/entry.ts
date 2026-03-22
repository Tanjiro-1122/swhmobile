import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PIXVERSE_API_KEY = Deno.env.get("PIXVERSE_API-KEY");
const PIXVERSE_BASE_URL = "https://app-api.pixverse.ai/openapi/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, taskId } = body;

    // Check status of existing task
    if (action === 'status' && taskId) {
      const statusResponse = await fetch(`${PIXVERSE_BASE_URL}/video/result/${taskId}`, {
        method: 'GET',
        headers: {
          'API-KEY': PIXVERSE_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const statusData = await statusResponse.json();
      return Response.json(statusData);
    }

    // Generate new video
    if (action === 'generate') {
      // Step 1: Upload the image to PixVerse
      const imageUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e31dbf618_logo2.png";
      
      // Fetch the image
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('image', imageBlob, 'logo.png');

      console.log('Uploading image to PixVerse...');
      const uploadResponse = await fetch(`${PIXVERSE_BASE_URL}/image/upload`, {
        method: 'POST',
        headers: {
          'API-KEY': PIXVERSE_API_KEY,
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);

      if (!uploadData.Resp?.img_id) {
        return Response.json({ 
          error: 'Failed to upload image', 
          details: uploadData 
        }, { status: 500 });
      }

      const imgId = uploadData.Resp.img_id;

      // Step 2: Create video generation task
      const prompt = `Cinematic sports intro scene. The image transforms into a packed stadium with bright green grass, roaring crowd with flashing lights and camera flashes everywhere. A full-bodied soccer player appears on the left kicking a soccer ball to the right. A full-bodied quarterback appears on the right throwing a football to the left. Stats and numbers appear floating above each player briefly. The soccer ball and football collide in the center creating a dramatic explosion with sparks and energy. From the explosion, the letters "SWH" emerge boldly. Epic sports atmosphere, dynamic camera movement, cinematic lighting, high energy.`;

      console.log('Creating video generation task...');
      const videoResponse = await fetch(`${PIXVERSE_BASE_URL}/video/img2video`, {
        method: 'POST',
        headers: {
          'API-KEY': PIXVERSE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "v3.5",
          img_id: imgId,
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, text overlay",
          duration: 5,
          quality: "high",
          aspect_ratio: "16:9",
          motion_mode: "normal",
          seed: Math.floor(Math.random() * 1000000)
        })
      });

      const videoData = await videoResponse.json();
      console.log('Video generation response:', videoData);

      if (!videoData.Resp?.task_id) {
        return Response.json({ 
          error: 'Failed to create video task', 
          details: videoData 
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        message: 'Video generation started! Check status in a few minutes.',
        task_id: videoData.Resp.task_id,
        instructions: 'Call this function again with action="status" and taskId to check progress'
      });
    }

    return Response.json({ 
      error: 'Invalid action. Use action="generate" to start or action="status" with taskId to check progress' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});