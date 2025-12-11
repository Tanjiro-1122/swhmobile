import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { error_type, severity, function_name, error_message, error_stack, context } = await req.json();
    
    // Get user email if authenticated
    let user_email = null;
    try {
      const user = await base44.auth.me();
      user_email = user?.email;
    } catch (e) {
      // User not authenticated, that's ok
    }
    
    // Create error log entry
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type,
      severity: severity || 'error',
      function_name,
      error_message,
      error_stack,
      user_email,
      context: context || {},
      resolved: false
    });
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});