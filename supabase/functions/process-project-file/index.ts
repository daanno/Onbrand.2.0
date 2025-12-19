import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { extractText } from "npm:unpdf";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessFileRequest {
  file_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { file_id } = (await req.json()) as ProcessFileRequest;

    if (!file_id) {
      return new Response(
        JSON.stringify({ error: "file_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file record
    const { data: fileRecord, error: fetchError } = await supabase
      .from("project_files")
      .select("*")
      .eq("id", file_id)
      .single();

    if (fetchError || !fileRecord) {
      return new Response(
        JSON.stringify({ error: "File not found", details: fetchError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("project_files")
      .update({ status: "processing" })
      .eq("id", file_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("project-files")
      .download(fileRecord.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("project_files")
        .update({ status: "error", error_message: "Failed to download file" })
        .eq("id", file_id);

      return new Response(
        JSON.stringify({ error: "Failed to download file", details: downloadError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text based on file type
    let extractedText = "";
    const fileType = fileRecord.file_type.toLowerCase();

    try {
      if (fileType.includes("text/plain") || fileType.includes("text/markdown")) {
        // Plain text or markdown - read directly
        extractedText = await fileData.text();
      } else if (fileType.includes("text/csv")) {
        // CSV - read as text
        extractedText = await fileData.text();
      } else if (fileType.includes("application/json")) {
        // JSON - format nicely
        const jsonText = await fileData.text();
        try {
          const parsed = JSON.parse(jsonText);
          extractedText = JSON.stringify(parsed, null, 2);
        } catch {
          extractedText = jsonText;
        }
      } else if (fileType.includes("pdf")) {
        // PDF - extract text using basic method
        // Note: For complex PDFs, you'd want a proper PDF parsing library
        const arrayBuffer = await fileData.arrayBuffer();
        extractedText = await extractTextFromPDF(new Uint8Array(arrayBuffer));
      } else if (
        fileType.includes("msword") ||
        fileType.includes("wordprocessingml")
      ) {
        // Word documents - extract basic text
        const arrayBuffer = await fileData.arrayBuffer();
        extractedText = await extractTextFromDocx(new Uint8Array(arrayBuffer));
      } else if (
        fileType.includes("ms-excel") ||
        fileType.includes("spreadsheetml")
      ) {
        // Excel - for now just note it's a spreadsheet
        extractedText = `[Excel spreadsheet: ${fileRecord.name}]\nNote: Spreadsheet content parsing is limited. Consider uploading as CSV for better text extraction.`;
      } else {
        // Unknown type - try reading as text
        try {
          extractedText = await fileData.text();
        } catch {
          extractedText = `[Binary file: ${fileRecord.name}]\nCould not extract text content.`;
        }
      }

      // Truncate if too long (keep first 100k characters)
      const maxLength = 100000;
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + "\n\n[Content truncated...]";
      }

      // Update file record with extracted text
      const { error: updateError } = await supabase
        .from("project_files")
        .update({
          status: "ready",
          extracted_text: extractedText,
          error_message: null,
        })
        .eq("id", file_id);

      if (updateError) {
        console.error("Failed to update file record:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to save extracted text", 
            details: updateError.message 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully extracted and saved text for file:", file_id, "length:", extractedText.length);

      return new Response(
        JSON.stringify({
          success: true,
          file_id,
          text_length: extractedText.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (extractError) {
      const errorMessage = extractError instanceof Error ? extractError.message : "Unknown extraction error";
      
      await supabase
        .from("project_files")
        .update({
          status: "error",
          error_message: errorMessage,
        })
        .eq("id", file_id);

      return new Response(
        JSON.stringify({ error: "Failed to extract text", details: errorMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Production-grade PDF text extraction using unpdf
async function extractTextFromPDF(data: Uint8Array): Promise<string> {
  try {
    // Use unpdf for production-grade PDF text extraction
    const result = await extractText(data, { mergePages: true });
    
    console.log('unpdf extraction result:', {
      totalPages: result.totalPages,
      textLength: result.text?.length || 0
    });
    
    if (result.text && result.text.trim().length > 50) {
      // Clean up the extracted text
      const cleanedText = result.text
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      console.log(`Successfully extracted ${cleanedText.length} characters from ${result.totalPages} pages`);
      return cleanedText;
    }
    
    // If unpdf didn't get much text, try fallback
    console.log('unpdf returned minimal text, trying fallback extraction');
    return await extractTextFromPDFFallback(data);
    
  } catch (error) {
    console.error('unpdf extraction failed:', error);
    // Fall back to manual extraction
    return await extractTextFromPDFFallback(data);
  }
}

// Fallback PDF extraction for edge cases
async function extractTextFromPDFFallback(data: Uint8Array): Promise<string> {
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(data);
  
  const textParts: string[] = [];
  
  // Try to decompress and extract from FlateDecode streams
  const streamRegex = /<<([^>]*)\/FlateDecode([^>]*)>>\s*stream\r?\n/g;
  const endstreamRegex = /\r?\nendstream/g;
  
  let streamMatch;
  while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
    const streamStart = streamMatch.index + streamMatch[0].length;
    endstreamRegex.lastIndex = streamStart;
    const endMatch = endstreamRegex.exec(pdfString);
    if (!endMatch) continue;
    
    const streamEnd = endMatch.index;
    const streamData = data.slice(streamStart, streamEnd);
    
    try {
      // Try to decompress using DecompressionStream
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();
      
      writer.write(streamData);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const decompressed = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      const content = new TextDecoder('latin1').decode(decompressed);
      
      // Extract text from Tj/TJ operators
      const tjRegex = /\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(content)) !== null) {
        if (tjMatch[1]) {
          const text = tjMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          if (text.trim()) textParts.push(text);
        }
      }
    } catch {
      // Decompression failed, continue
    }
  }
  
  // Also extract any uncompressed text
  const simpleTextRegex = /\(([^)]{3,})\)\s*Tj/g;
  let simpleMatch;
  while ((simpleMatch = simpleTextRegex.exec(pdfString)) !== null) {
    if (simpleMatch[1]) {
      const text = simpleMatch[1].replace(/\\([nrt()])/g, (_, c) => {
        const escapes: Record<string, string> = { n: '\n', r: '', t: '\t', '(': '(', ')': ')' };
        return escapes[c] || c;
      });
      if (text.trim() && !textParts.includes(text)) {
        textParts.push(text);
      }
    }
  }
  
  // Extract metadata
  const titleMatch = pdfString.match(/\/Title\s*\(([^)]+)\)/);
  const authorMatch = pdfString.match(/\/Author\s*\(([^)]+)\)/);
  
  let metadata = '';
  if (titleMatch?.[1]) metadata += `Title: ${titleMatch[1]}\n`;
  if (authorMatch?.[1]) metadata += `Author: ${authorMatch[1]}\n`;
  
  const result = textParts
    .filter(t => t && t.trim().length > 1)
    .filter(t => {
      const printable = (t.match(/[\x20-\x7E]/g) || []).length;
      return printable / t.length > 0.7;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (result.length < 50) {
    return `[PDF file - limited extraction]\n${metadata}\nThe PDF uses compression or fonts that couldn't be fully processed.\n\nPartial content:\n${result.substring(0, 500)}`;
  }
  
  return metadata ? `${metadata}\n${result}` : result;
}

// Basic DOCX text extraction - simplified approach
async function extractTextFromDocx(data: Uint8Array): Promise<string> {
  // DOCX files are ZIP archives containing XML
  // For reliable extraction, we'll look for readable text patterns
  
  try {
    // Try to decode as text and look for Word XML patterns
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const content = decoder.decode(data);
    
    const textParts: string[] = [];
    
    // Look for Word text elements - these appear even in compressed data sometimes
    // Match text between <w:t> tags
    const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = textRegex.exec(content)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 0) {
        textParts.push(text);
      }
    }
    
    // If no Word XML found, try generic text extraction
    if (textParts.length === 0) {
      // Look for any readable ASCII text sequences
      const asciiRegex = /[\x20-\x7E]{10,}/g;
      while ((match = asciiRegex.exec(content)) !== null) {
        const text = match[0].trim();
        // Filter out XML/binary noise
        if (text && !text.includes("<?xml") && !text.includes("xmlns") && !text.includes("Content-Type")) {
          textParts.push(text);
        }
      }
    }
    
    const result = textParts.join(" ").replace(/\s+/g, " ").trim();
    
    if (result.length < 100) {
      return `[Word document]\nFile: This is a Word document. For best results, please copy the text content and save as a .txt file, then upload that instead.\n\nExtracted preview: ${result.substring(0, 200)}`;
    }
    
    return result;
  } catch (error) {
    return `[Word document - extraction failed]\nFor best results with Word documents, please:\n1. Open the document in Word\n2. Select All (Ctrl+A) and Copy (Ctrl+C)\n3. Paste into a new .txt file\n4. Upload the .txt file instead`;
  }
}
