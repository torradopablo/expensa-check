import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // Get the user from the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid token'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);
    // 1. Delete files from storage
    // The files are in bucket 'expense-files' in folder userId/
    try {
      let hasMore = true;
      let totalDeleted = 0;
      while(hasMore){
        const { data: files } = await supabaseClient.storage.from('expense-files').list(userId, {
          limit: 100,
          offset: 0,
          sortBy: {
            column: 'name',
            order: 'asc'
          },
          search: ''
        });
        if (!files || files.length === 0) {
          hasMore = false;
          break;
        }
        const pathsToDelete = files.map((f)=>`${userId}/${f.name}`);
        // If it returns the same folder itself or a placeholder, try to ensure we delete the paths
        const { error: removeError, data: removedData } = await supabaseClient.storage.from('expense-files').remove(pathsToDelete);
        if (removeError) {
          console.error('Error removing files batch:', removeError);
          // Break to avoid infinite loop on persistent error 
          hasMore = false;
        } else if (removedData) {
          totalDeleted += removedData.length;
          console.log(`Deleted batch of ${removedData.length} files. Total so far: ${totalDeleted}`);
          // If we removed fewer than we asked for, or exactly 0, prevent infinite loop
          if (removedData.length === 0) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      // Try to explicitly delete the root user folder object if it exists as an empty placeholder
      await supabaseClient.storage.from('expense-files').remove([
        `${userId}`
      ]);
      await supabaseClient.storage.from('expense-files').remove([
        `${userId}/.emptyFolderPlaceholder`
      ]);
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError);
    // Continue even if storage deletion fails
    }
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete user in Supabase auth admin:', deleteError);
      throw deleteError;
    }
    return new Response(JSON.stringify({
      message: 'Account deleted successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    // Handle Supabase AuthError stringification properly
    const errorMessage = typeof error === 'object' && error !== null ? error.message || JSON.stringify(error) : String(error);
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
