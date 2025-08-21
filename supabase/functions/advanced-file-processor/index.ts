Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { fileData, fileName, fileType, contextType = 'agent', contextId } = await req.json();

        if (!fileData || !fileName) {
            throw new Error('File data and filename are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Extract base64 data
        const base64Data = fileData.split(',')[1];
        const mimeType = fileData.split(';')[0].split(':')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Generate unique file path
        const timestamp = Date.now();
        const filePath = `${contextType}/${contextId || userId}/${timestamp}_${fileName}`;

        // Upload to storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/agent-files/${filePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Extract text content based on file type
        let extractedText = '';
        try {
            if (mimeType === 'text/plain' || mimeType === 'text/csv') {
                extractedText = atob(base64Data);
            } else if (mimeType === 'application/json') {
                const jsonContent = JSON.parse(atob(base64Data));
                extractedText = JSON.stringify(jsonContent, null, 2);
            } else {
                // For other file types, store a placeholder
                extractedText = `[${fileType || 'File'} content - ${fileName}]`;
            }
        } catch (extractError) {
            console.warn('Text extraction failed:', extractError.message);
            extractedText = `[Content extraction failed for ${fileName}]`;
        }

        // Save file metadata to database
        const fileRecord = {
            filename: fileName,
            original_name: fileName,
            file_path: filePath,
            file_size: binaryData.length,
            mime_type: mimeType,
            uploader_id: userId,
            context_type: contextType,
            context_id: contextId,
            processing_status: 'completed',
            extracted_text: extractedText,
            metadata: {
                upload_timestamp: timestamp,
                file_type: fileType,
                size_bytes: binaryData.length
            }
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/file_uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(fileRecord)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Database insert failed: ${errorText}`);
        }

        const savedFile = await insertResponse.json();
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/agent-files/${filePath}`;

        return new Response(JSON.stringify({
            data: {
                fileId: savedFile[0].id,
                fileName: fileName,
                filePath: filePath,
                publicUrl: publicUrl,
                extractedText: extractedText,
                fileSize: binaryData.length,
                mimeType: mimeType,
                status: 'completed'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('File processing error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'FILE_PROCESSING_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});