import dotenv from 'dotenv';
dotenv.config();

/**
 * Resolves the official assembly constituency and district for a given college name in Telangana
 * using the Groq Chat Completion API.
 * 
 * @param {string} collegeName - The name of the college to resolve
 * @param {Array} existingConstituencies - Array of existing constituencies from the database
 * @returns {Promise<Object|null>} - Resolved constituency metadata or null if mapping fails
 */
export async function resolveConstituencyWithAI(collegeName, existingConstituencies) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ [AI Mapping] GROQ_API_KEY is not configured in environment variables. Falling back.');
    return null;
  }

  // Format existing constituencies list to feed into Groq prompt
  const formattedList = existingConstituencies
    .map(c => `- ${c.constituency_name} (District: ${c.district}, ID: ${c.id})`)
    .join('\n');

  const systemPrompt = `You are a professional geo-spatial administrative mapping assistant for the State of Telangana, India.
Your sole task is to identify which Assembly Constituency and District a given College/School belongs to.

We have a list of active constituencies in our database:
${formattedList}

Rules:
1. Analyze the given college name and determine its exact location.
2. If the college belongs to one of the active constituencies listed above, map it to that constituency. Use the EXACT constituency name and ID from the database list.
3. If the college belongs to a Telangana Assembly Constituency that is NOT in the database list, identify the correct constituency name and its official district. Set "is_new" to true.
4. If you cannot identify the college's constituency or it does not exist, map it to "Upcoming Area" (District: "Statewide") which is a default fallback node.
5. Return the result strictly in JSON format. Do not return any other text, notes, markdown formatting, or HTML.

Response JSON Schema:
{
  "constituency_name": "Exact matching constituency name",
  "constituency_id": number or null (if it's new),
  "district": "Official District name",
  "is_new": true/false,
  "reasoning": "A one-sentence explanation of where the college is located and why it maps to this constituency."
}`;

  try {
    const model = process.env.GROQ_MODEL || 'groq/compound-mini';
    console.log(`🤖 [AI Mapping] Using Groq model: ${model}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Identify the constituency for this college: "${collegeName}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    const raw = await response.text();
    // Log raw response for debugging
    console.log('🤖 [AI Mapping] Raw Groq response:', raw);

    if (!response.ok) {
      throw new Error(`Groq API responded with status ${response.status}: ${raw}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error('🚨 [AI Mapping] Failed to parse Groq JSON response:', parseErr.message);
      return null;
    }

    // Some Groq responses may already be JSON in message.content; try to parse safely
    try {
      const content = data.choices?.[0]?.message?.content;
      const result = typeof content === 'string' ? JSON.parse(content) : content;
      console.log(`🤖 [AI Mapping] Groq mapped "${collegeName}" to:`, result);
      return result;
    } catch (innerErr) {
      console.error('🚨 [AI Mapping] Failed to extract mapping from Groq response:', innerErr.message);
      return null;
    }
  } catch (err) {
    console.error('🚨 [AI Mapping Error] Failed to map college using Groq:', err.message);
    return null;
  }
}
